import { type FormElement } from "@shared/schema";

// Form element types
export const BASIC_ELEMENTS = [
  {
    type: "text",
    icon: "font",
    label: "Text Field"
  },
  {
    type: "number",
    icon: "hashtag",
    label: "Number Field"
  },
  {
    type: "email",
    icon: "mail",
    label: "Email Field"
  },
  {
    type: "password",
    icon: "key",
    label: "Password Field"
  },
  {
    type: "phone",
    icon: "phone",
    label: "Phone Number"
  },
  {
    type: "url",
    icon: "link",
    label: "URL Field"
  },
  {
    type: "date",
    icon: "calendar",
    label: "Date Picker"
  },
  {
    type: "time",
    icon: "clock",
    label: "Time Picker"
  },
  {
    type: "datetime",
    icon: "calendar-clock",
    label: "Date & Time"
  },
  {
    type: "textarea",
    icon: "align-left",
    label: "Text Area"
  },
  {
    type: "richtext",
    icon: "text",
    label: "Rich Text Editor"
  },
  {
    type: "currency",
    icon: "dollar-sign",
    label: "Currency Field"
  },
  {
    type: "percentage",
    icon: "percent",
    label: "Percentage Field"
  }
];

export const OPTION_ELEMENTS = [
  {
    type: "dropdown",
    icon: "chevron-down-square",
    label: "Dropdown"
  },
  {
    type: "combobox",
    icon: "list-filter",
    label: "Combo Box"
  },
  {
    type: "multiselect",
    icon: "list-checks",
    label: "Multi-Select"
  },
  {
    type: "radio",
    icon: "circle-dot",
    label: "Radio Buttons"
  },
  {
    type: "checkbox",
    icon: "check-square",
    label: "Checkboxes"
  },
  {
    type: "toggle",
    icon: "toggle-left",
    label: "Toggle Switch"
  },
  {
    type: "rating",
    icon: "star",
    label: "Rating"
  },
  {
    type: "slider",
    icon: "sliders",
    label: "Slider"
  }
];

export const LAYOUT_ELEMENTS = [
  {
    type: "section",
    icon: "square",
    label: "Section"
  },
  {
    type: "column",
    icon: "columns",
    label: "Columns"
  },
  {
    type: "tabs",
    icon: "tab",
    label: "Tabs"
  },
  {
    type: "accordion",
    icon: "panels-top-left",
    label: "Accordion"
  },
  {
    type: "divider",
    icon: "minus",
    label: "Divider"
  },
  {
    type: "spacer",
    icon: "square-dot",
    label: "Spacer"
  }
];

export const ADVANCED_ELEMENTS = [
  {
    type: "file",
    icon: "file-up",
    label: "File Upload"
  },
  {
    type: "image",
    icon: "image",
    label: "Image Upload"
  },
  {
    type: "signature",
    icon: "pencil",
    label: "Signature Pad"
  },
  {
    type: "barcode",
    icon: "barcode",
    label: "Barcode Scanner"
  },
  {
    type: "datatable",
    icon: "table",
    label: "Data Table"
  },
  {
    type: "chart",
    icon: "bar-chart",
    label: "Chart"
  },
  {
    type: "gallery",
    icon: "layout-grid",
    label: "Gallery"
  },
  {
    type: "button",
    icon: "square-button",
    label: "Button"
  },
  {
    type: "html",
    icon: "code",
    label: "HTML Viewer"
  }
];

// Button specific constants
export const BUTTON_TYPES = [
  { value: "submit", label: "Submit Form" },
  { value: "reset", label: "Reset Form" },
  { value: "approve", label: "Approve Submission" },
  { value: "reject", label: "Reject Submission" },
  { value: "request-approval", label: "Request Approval" },
  { value: "custom", label: "Custom Action" }
];

export const BUTTON_VARIANTS = [
  { value: "default", label: "Default" },
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "outline", label: "Outline" },
  { value: "destructive", label: "Destructive" },
  { value: "ghost", label: "Ghost" },
  { value: "link", label: "Link" }
];

// Sample default element configurations
export function getDefaultElement(type: string): FormElement {
  const id = `field_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  const baseElement: FormElement = {
    id,
    type: type as any,
    label: getDefaultLabel(type),
    name: id,
    placeholder: "",
    required: false,
    helpText: "",
    validation: {
      minLength: 0,
      maxLength: 100,
      errorMessage: ""
    }
  };
  
  switch (type) {
    // Basic Elements
    case "text":
      return {
        ...baseElement,
        placeholder: "Enter text",
      };
    case "number":
      return {
        ...baseElement,
        placeholder: "Enter number",
        validation: {
          ...baseElement.validation,
          min: 0,
          max: 100,
        }
      };
    case "email":
      return {
        ...baseElement,
        placeholder: "name@example.com",
        validation: {
          ...baseElement.validation,
          pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$",
          errorMessage: "Please enter a valid email address"
        }
      };
    case "password":
      return {
        ...baseElement,
        placeholder: "••••••••",
        validation: {
          ...baseElement.validation,
          minLength: 8,
          errorMessage: "Password must be at least 8 characters"
        }
      };
    case "phone":
      return {
        ...baseElement,
        placeholder: "(123) 456-7890",
        validation: {
          ...baseElement.validation,
          pattern: "^[\\+]?[(]?[0-9]{3}[)]?[-\\s\\.]?[0-9]{3}[-\\s\\.]?[0-9]{4,6}$",
          errorMessage: "Please enter a valid phone number"
        }
      };
    case "url":
      return {
        ...baseElement,
        placeholder: "https://example.com",
        validation: {
          ...baseElement.validation,
          pattern: "https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)",
          errorMessage: "Please enter a valid URL"
        }
      };
    case "date":
      return {
        ...baseElement,
        format: "yyyy-MM-dd",
      };
    case "time":
      return {
        ...baseElement,
        format: "HH:mm",
      };
    case "datetime":
      return {
        ...baseElement,
        format: "yyyy-MM-dd HH:mm",
      };
    case "textarea":
      return {
        ...baseElement,
        placeholder: "Enter text here",
        rows: 4,
      };
    case "richtext":
      return {
        ...baseElement,
        defaultValue: "",
        toolbar: ["bold", "italic", "underline", "link", "bulletList", "numberedList"],
      };
    case "currency":
      return {
        ...baseElement,
        placeholder: "0.00",
        prefix: "$",
        precision: 2,
        validation: {
          ...baseElement.validation,
          min: 0,
        }
      };
    case "percentage":
      return {
        ...baseElement,
        placeholder: "0",
        suffix: "%",
        validation: {
          ...baseElement.validation,
          min: 0,
          max: 100,
        }
      };
    
    // Option Elements
    case "dropdown":
      return {
        ...baseElement,
        placeholder: "Select an option",
        optionsSource: "static",
        options: [
          { label: "Option 1", value: "option1" },
          { label: "Option 2", value: "option2" },
          { label: "Option 3", value: "option3" }
        ]
      };
    case "combobox":
      return {
        ...baseElement,
        placeholder: "Search or select...",
        allowCustomValue: true,
        optionsSource: "static",
        options: [
          { label: "Option 1", value: "option1" },
          { label: "Option 2", value: "option2" },
          { label: "Option 3", value: "option3" }
        ]
      };
    case "multiselect":
      return {
        ...baseElement,
        placeholder: "Select options",
        optionsSource: "static",
        options: [
          { label: "Option 1", value: "option1" },
          { label: "Option 2", value: "option2" },
          { label: "Option 3", value: "option3" }
        ]
      };
    case "radio":
      return {
        ...baseElement,
        options: [
          { label: "Option 1", value: "option1" },
          { label: "Option 2", value: "option2" },
          { label: "Option 3", value: "option3" }
        ],
        layout: "vertical"
      };
    case "checkbox":
      return {
        ...baseElement,
        options: [
          { label: "Option 1", value: "option1" },
          { label: "Option 2", value: "option2" },
          { label: "Option 3", value: "option3" }
        ]
      };
    case "toggle":
      return {
        ...baseElement,
        defaultValue: false,
        onLabel: "On",
        offLabel: "Off"
      };
    case "rating":
      return {
        ...baseElement,
        maxRating: 5,
        defaultValue: 0,
        icon: "star"
      };
    case "slider":
      return {
        ...baseElement,
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 50,
        showMarkers: true
      };
    
    // Layout Elements
    case "section":
      return {
        ...baseElement,
        elements: [],
        collapsed: false,
        description: "Section description"
      };
    case "column":
      return {
        ...baseElement,
        columns: [
          { id: `col1_${id}`, elements: [] },
          { id: `col2_${id}`, elements: [] }
        ],
        gapSize: "medium"
      };
    case "tabs":
      return {
        ...baseElement,
        tabs: [
          { id: `tab1_${id}`, label: "Tab 1", elements: [] },
          { id: `tab2_${id}`, label: "Tab 2", elements: [] }
        ]
      };
    case "accordion":
      return {
        ...baseElement,
        items: [
          { id: `item1_${id}`, label: "Item 1", elements: [], expanded: true },
          { id: `item2_${id}`, label: "Item 2", elements: [], expanded: false }
        ]
      };
    case "divider":
      return {
        ...baseElement,
        thickness: 1,
        style: "solid"
      };
    case "spacer":
      return {
        ...baseElement,
        height: 24
      };
      
    // Advanced Elements
    case "file":
      return {
        ...baseElement,
        multiple: false,
        acceptedFileTypes: ".pdf,.doc,.docx,.txt",
        maxFileSize: 5 // in MB
      };
    case "image":
      return {
        ...baseElement,
        multiple: false,
        acceptedFileTypes: ".jpg,.jpeg,.png,.gif",
        maxFileSize: 2, // in MB
        resize: true
      };
    case "signature":
      return {
        ...baseElement,
        penColor: "#000000",
        backgroundColor: "#ffffff",
        clearable: true
      };
    case "barcode":
      return {
        ...baseElement,
        format: "qr",
        value: "",
        size: "medium"
      };
    case "datatable":
      return {
        ...baseElement,
        columns: [
          { id: `col1_${id}`, header: "Column 1", field: "field1" },
          { id: `col2_${id}`, header: "Column 2", field: "field2" }
        ],
        dataSource: null,
        pagination: true,
        pageSize: 10
      };
    case "chart":
      return {
        ...baseElement,
        chartType: "bar",
        dataSource: null,
        xAxis: "",
        yAxis: "",
        height: 300
      };
    case "gallery":
      return {
        ...baseElement,
        dataSource: null,
        template: {
          elements: []
        },
        layout: "grid",
        itemsPerRow: 3
      };
    case "button":
      return {
        ...baseElement,
        label: "Submit",
        buttonType: "submit",
        buttonVariant: "primary",
        buttonAction: {
          type: "submit-form",
          requireConfirmation: false,
          requireReason: false,
          confirmationMessage: "Are you sure you want to submit this form?",
          validationRules: "",
          notifyUsers: [],
          navigateTo: "",
          onSuccess: "",
          onError: ""
        },
        size: "medium"
      };
    case "html":
      return {
        ...baseElement,
        content: "<p>Custom HTML content</p>"
      };
    default:
      return baseElement;
  }
}

function getDefaultLabel(type: string): string {
  switch (type) {
    // Basic elements
    case "text":
      return "Text Field";
    case "number":
      return "Number";
    case "email":
      return "Email";
    case "password":
      return "Password";
    case "phone":
      return "Phone Number";
    case "url":
      return "URL";
    case "date":
      return "Date";
    case "time":
      return "Time";
    case "datetime":
      return "Date & Time";
    case "textarea":
      return "Text Area";
    case "richtext":
      return "Rich Text";
    case "currency":
      return "Currency";
    case "percentage":
      return "Percentage";
    
    // Option elements
    case "dropdown":
      return "Select Option";
    case "combobox":
      return "Combo Box";
    case "multiselect":
      return "Multi-Select";
    case "radio":
      return "Radio Buttons";
    case "checkbox":
      return "Checkboxes";
    case "toggle":
      return "Toggle";
    case "rating":
      return "Rating";
    case "slider":
      return "Slider";
    
    // Layout elements
    case "section":
      return "Section";
    case "column":
      return "Columns";
    case "tabs":
      return "Tabs";
    case "accordion":
      return "Accordion";
    case "divider":
      return "Divider";
    case "spacer":
      return "Spacer";
    
    // Advanced elements
    case "file":
      return "File Upload";
    case "image":
      return "Image Upload";
    case "signature":
      return "Signature";
    case "barcode":
      return "Barcode Scanner";
    case "datatable":
      return "Data Table";
    case "chart":
      return "Chart";
    case "gallery":
      return "Gallery";
    case "button":
      return "Button";
    case "html":
      return "HTML Content";
    
    default:
      return "Field";
  }
}

// Navigation items - these will be filtered in sidebar based on role
export const NAVIGATION_ITEMS = [
  {
    category: "MAIN",
    items: [
      { icon: "home", label: "Applications", path: "/", adminOnly: false },
      { icon: "file", label: "All Forms", path: "/forms", adminOnly: false },
    ]
  },
  {
    category: "ADMINISTRATION",
    items: [
      { icon: "users", label: "Users", path: "/users", adminOnly: true },
      { icon: "shield", label: "Permissions", path: "/permissions", adminOnly: true },
      { icon: "database", label: "Data Sources", path: "/data-sources", adminOnly: true },
      { icon: "clipboard-check", label: "Approvals", path: "/approval-requests", adminOnly: false },
      { icon: "settings", label: "Settings", path: "/settings", adminOnly: true }
    ]
  }
];
