// app/routes/app.banner.jsx
import { useEffect, useState } from "react";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Box,
  Button,
  InlineStack,
  FormLayout,
  TextField,
  Select,
  ColorPicker,
  Banner as PolarisInfoBanner,
  hsbToRgb,
  rgbToHsb,
  rgbToHex,
  hexToRgb,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  
  // Check if our app block is installed in any theme
  const themeResponse = await admin.graphql(
    `#graphql
      query GetThemes {
        themes(first: 10) {
          nodes {
            id
            name
            role
          }
        }
      }
    `
  );
  
  const themeData = await themeResponse.json();
  const themes = themeData.data.themes.nodes;
  
  // Get default settings for the banner
  const defaultSettings = {
    heading: "Welcome to our store",
    description: "Check out our latest products and special offers.",
    banner_height: "medium",
    text_color: "#ffffff",
    background_color: "#4a4a4a",
  };
  
  return json({
    themes,
    defaultSettings,
  });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");
  
  if (action === "install") {
    // This would be the implementation to programmatically add the block to active theme
    // In a real implementation, you'd use the Theme API to modify templates
    
    return json({ 
      status: "success", 
      message: "Banner block is now available in your theme customizer.",
      action: "install"
    });
  }
  
  if (action === "update_defaults") {
    // Here you would save the default settings for new banners
    // In a real implementation, you'd store these in your database
    
    const settings = {
      heading: formData.get("heading"),
      description: formData.get("description"),
      banner_height: formData.get("banner_height"),
      text_color: formData.get("text_color"),
      background_color: formData.get("background_color"),
    };
    
    return json({ 
      status: "success", 
      message: "Default settings updated successfully.",
      action: "update_defaults",
      settings
    });
  }
  
  return json({ status: "error", message: "Invalid action" });
};

export default function BannerManagementPage() {
  const { themes, defaultSettings } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();
  
  const [formValues, setFormValues] = useState(defaultSettings);
  const [textColorPickerActive, setTextColorPickerActive] = useState(false);
  const [bgColorPickerActive, setBgColorPickerActive] = useState(false);
  
  // Convert hex color to HSB for the color picker
  const hexToHsb = (hex) => {
    const rgb = hexToRgb(hex);
    return rgb ? rgbToHsb(rgb) : { hue: 0, saturation: 0, brightness: 0 };
  };
  
  // Convert HSB color to hex for storing
  const hsbToHex = (hsb) => {
    const rgb = hsbToRgb(hsb);
    return rgbToHex(rgb);
  };
  
  // Set initial form values
  useEffect(() => {
    // If we have updated settings from an action, use those
    if (actionData?.settings) {
      setFormValues(actionData.settings);
    } else {
      setFormValues(defaultSettings);
    }
  }, [defaultSettings, actionData]);
  
  const handleInstall = () => {
    submit({ action: "install" }, { method: "post" });
  };
  
  const handleUpdateDefaults = () => {
    submit(
      { 
        action: "update_defaults",
        ...formValues
      }, 
      { method: "post" }
    );
  };
  
  const handleFormChange = (field, value) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const isLoading = navigation.state === "submitting";
  const activeTheme = themes.find(theme => theme.role === "main");
  
  return (
    <Page>
      <TitleBar title="Banner Management" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  Banner Block Extension
                </Text>
                
                <Text as="p">
                  This extension allows you to add customizable banners to your store theme.
                  Once installed, you can add banners through the theme customizer.
                </Text>
                
                {actionData?.status === "success" && (
                  <PolarisInfoBanner title="Success" tone="success">
                    {actionData.message}
                  </PolarisInfoBanner>
                )}
                
                <Box paddingBlockStart="400">
                  <Button 
                    primary 
                    onClick={handleInstall}
                    loading={isLoading && navigation.formData?.get("action") === "install"}
                    disclosure="down"
                  >
                    Make Banner Available in Theme Editor
                  </Button>
                </Box>
                
                <InlineStack align="space-between">
                  <Text as="span" variant="bodyMd">
                    Active Theme
                  </Text>
                  <Text as="span" variant="bodyMd" fontWeight="bold">
                    {activeTheme?.name || "No active theme found"}
                  </Text>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
          
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  Default Banner Settings
                </Text>
                
                <Text as="p">
                  Configure the default settings for new banners. These settings will be applied
                  when you add a new banner through the theme customizer.
                </Text>
                
                <FormLayout>
                  <TextField
                    label="Default Heading"
                    value={formValues.heading}
                    onChange={(value) => handleFormChange("heading", value)}
                    autoComplete="off"
                  />
                  
                  <TextField
                    label="Default Description"
                    value={formValues.description}
                    onChange={(value) => handleFormChange("description", value)}
                    multiline={3}
                    autoComplete="off"
                  />
                  
                  <Select
                    label="Default Banner Height"
                    options={[
                      {label: "Small", value: "small"},
                      {label: "Medium", value: "medium"},
                      {label: "Large", value: "large"},
                    ]}
                    value={formValues.banner_height}
                    onChange={(value) => handleFormChange("banner_height", value)}
                  />
                  
                  <TextField
                    label="Text Color"
                    value={formValues.text_color}
                    onChange={(value) => handleFormChange("text_color", value)}
                    autoComplete="off"
                    connectedRight={
                      <Button 
                        onClick={() => setTextColorPickerActive(!textColorPickerActive)} 
                        icon={<div style={{
                          width: "20px", 
                          height: "20px", 
                          backgroundColor: formValues.text_color,
                          borderRadius: "3px",
                          border: "1px solid #ddd"
                        }} />}
                      />
                    }
                  />
                  
                  {textColorPickerActive && (
                    <Box padding="400" border="base" borderRadius="200">
                      <ColorPicker
                        onChange={(hsb) => handleFormChange("text_color", hsbToHex(hsb))}
                        color={hexToHsb(formValues.text_color)}
                      />
                    </Box>
                  )}
                  
                  <TextField
                    label="Background Color"
                    value={formValues.background_color}
                    onChange={(value) => handleFormChange("background_color", value)}
                    autoComplete="off"
                    connectedRight={
                      <Button 
                        onClick={() => setBgColorPickerActive(!bgColorPickerActive)} 
                        icon={<div style={{
                          width: "20px", 
                          height: "20px", 
                          backgroundColor: formValues.background_color,
                          borderRadius: "3px",
                          border: "1px solid #ddd"
                        }} />}
                      />
                    }
                  />
                  
                  {bgColorPickerActive && (
                    <Box padding="400" border="base" borderRadius="200">
                      <ColorPicker
                        onChange={(hsb) => handleFormChange("background_color", hsbToHex(hsb))}
                        color={hexToHsb(formValues.background_color)}
                      />
                    </Box>
                  )}
                </FormLayout>
                
                <Box paddingBlockStart="400">
                  <Button 
                    primary 
                    onClick={handleUpdateDefaults}
                    loading={isLoading && navigation.formData?.get("action") === "update_defaults"}
                  >
                    Save Default Settings
                  </Button>
                </Box>
              </BlockStack>
            </Card>
          </Layout.Section>
          
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Banner Preview
                </Text>
                
                <div style={{
                  backgroundColor: formValues.background_color,
                  color: formValues.text_color,
                  padding: "20px",
                  borderRadius: "8px",
                  textAlign: "center",
                  minHeight: formValues.banner_height === "small" ? "100px" : 
                             formValues.banner_height === "medium" ? "150px" : "200px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center"
                }}>
                  <Text as="h3" variant="headingMd" fontWeight="bold" style={{color: formValues.text_color}}>
                    {formValues.heading || "Banner Heading"}
                  </Text>
                  <Text as="p" style={{color: formValues.text_color}}>
                    {formValues.description || "Banner description goes here."}
                  </Text>
                </div>
                
                <Text as="p" variant="bodySm">
                  This is a simplified preview. The actual banner will include your selected image
                  and may appear differently based on your theme's styles.
                </Text>
              </BlockStack>
            </Card>
            
            <Box paddingBlockStart="500">
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    How to use
                  </Text>
                  
                  <Text as="p" variant="bodyMd">
                    1. Click "Make Banner Available" to register the extension
                  </Text>
                  
                  <Text as="p" variant="bodyMd">
                    2. Go to your Shopify admin and open the theme customizer
                  </Text>
                  
                  <Text as="p" variant="bodyMd">
                    3. Select a section and click "Add block"
                  </Text>
                  
                  <Text as="p" variant="bodyMd">
                    4. Choose "Custom Banner" from the list of available blocks
                  </Text>
                  
                  <Text as="p" variant="bodyMd">
                    5. Configure your banner settings and save
                  </Text>
                </BlockStack>
              </Card>
            </Box>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}