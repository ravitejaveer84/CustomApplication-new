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
    type: "date",
    icon: "calendar",
    label: "Date Picker"
  },
  {
    type: "textarea",
    icon: "align-left",
    label: "Text Area"
  }
];

export const OPTION_ELEMENTS = [
  {
    type: "dropdown",
    icon: "chevron-down-square",
    label: "Dropdown"
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
    type: "divider",
    icon: "minus",
    label: "Divider"
  }
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
    case "text":
      return {
        ...baseElement,
        placeholder: "Enter text",
      };
    case "number":
      return {
        ...baseElement,
        placeholder: "Enter number",
      };
    case "date":
      return baseElement;
    case "textarea":
      return {
        ...baseElement,
        placeholder: "Enter text here",
      };
    case "dropdown":
      return {
        ...baseElement,
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
          { label: "Option 2", value: "option2" }
        ]
      };
    case "checkbox":
      return {
        ...baseElement,
        options: [
          { label: "Option 1", value: "option1" },
          { label: "Option 2", value: "option2" }
        ]
      };
    case "toggle":
      return baseElement;
    case "section":
      return {
        ...baseElement,
        elements: []
      };
    case "column":
      return {
        ...baseElement,
        columns: [
          { id: `col1_${id}`, elements: [] },
          { id: `col2_${id}`, elements: [] }
        ]
      };
    case "divider":
      return baseElement;
    default:
      return baseElement;
  }
}

function getDefaultLabel(type: string): string {
  switch (type) {
    case "text":
      return "Text Field";
    case "number":
      return "Number";
    case "date":
      return "Date";
    case "textarea":
      return "Text Area";
    case "dropdown":
      return "Select Option";
    case "radio":
      return "Radio Buttons";
    case "checkbox":
      return "Checkboxes";
    case "toggle":
      return "Toggle";
    case "section":
      return "Section";
    case "column":
      return "Columns";
    case "divider":
      return "Divider";
    default:
      return "Field";
  }
}

// Navigation items - these will be filtered in sidebar based on role
export const NAVIGATION_ITEMS = [
  {
    category: "ADMINISTRATION",
    items: [
      { icon: "users", label: "Users", path: "/users", adminOnly: true },
      { icon: "shield", label: "Permissions", path: "/permissions", adminOnly: true },
      { icon: "settings", label: "Settings", path: "/settings", adminOnly: true }
    ]
  }
];
