// shopify.server.js
import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";
import winston from "winston";
import axios from "axios";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "app.log" }),
  ],
});

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  hooks: {
    afterAuth: async ({ session }) => {
      logger.info("here>>>>>>>>>>>>>", session);
      logger.info("access>>>>>>>>>>>>>", session.accessToken);
      const accessToken = session.accessToken;
      console.log("accessTokensss", accessToken);
      if (!accessToken) {
        return;
      }

      const settings = JSON.stringify({ accountID: "123" });

      try {
        const query = `
            mutation webPixelCreate {
              webPixelCreate(webPixel: { settings: "{\\\"accountID\\\":\\\"123\\\"}" }) {
                userErrors {
                  code
                  field
                  message
                }
                webPixel {
                  settings
                  id
                }
              }
            }
          `;

        logger.info("Sending GraphQL query:", query);

        const response = await axios.post(
          `https://${session.shop}/admin/api/2024-07/graphql.json`,
          { query },
          {
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": session.accessToken,
            },
          },
        );

        if (response.data.errors) {
          logger.info("GraphQL Errors:");
          logger.info(response.data.errors);
        } else {
          logger.info("WebPixel Created:");
          logger.info(response.data);
        }
      } catch (error) {
        logger.info("Error creating web pixel:");
        logger.info(error);
      }

      logger.info("afterAuth");
      try {
        await axios.post(`${process.env.BACKEND_URL}/store`, {
          accessToken: session.accessToken,
          storeUrl: session.shop,
        });
        logger.info("here", session);
      } catch (error) {
        console.error(error);
      }
    },
  },
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;