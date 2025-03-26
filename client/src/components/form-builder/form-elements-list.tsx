import { BASIC_ELEMENTS, OPTION_ELEMENTS, LAYOUT_ELEMENTS, ADVANCED_ELEMENTS } from "@/lib/constants";
import * as LucideIcons from "lucide-react";

interface FormElementsListProps {
  onDragStart: (elementType: string) => void;
}

export function FormElementsList({ onDragStart }: FormElementsListProps) {
  // Helper function to get icon component by name
  const getIcon = (iconName: string) => {
    const iconClass = "h-4 w-4 text-gray-500 mr-2";
    
    // Convert kebab-case to PascalCase for Lucide icon names
    const pascalCase = iconName.split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    
    // Handle special cases for icons that don't follow the standard pattern
    const iconNameMap: Record<string, string> = {
      "font": "Type",
      "calendar-clock": "CalendarClock",
      "align-left": "AlignLeft",
      "chevron-down-square": "ChevronDownSquare",
      "list-filter": "ListFilter", 
      "list-checks": "ListChecks",
      "circle-dot": "CircleDot",
      "check-square": "CheckSquare",
      "toggle-left": "ToggleLeft",
      "square-dot": "SquareDot",
      "panels-top-left": "Layout", // Replacement for missing icon
      "file-up": "FileUp",
      "square-button": "Square", // Replacement for missing icon
      "bar-chart": "BarChart",
      "layout-grid": "LayoutGrid",
      "tab": "LayoutGrid" // Replacement for missing icon
    };
    
    const iconComponentName = iconNameMap[iconName] || pascalCase;
    const IconComponent = (LucideIcons as any)[iconComponentName] || LucideIcons.Type;
    
    return <IconComponent className={iconClass} />;
  };
  
  // Handle the drag start event
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, elementType: string) => {
    // Set the data transfer with the element type
    e.dataTransfer.setData('text/plain', elementType);
    // Call the parent component's drag start handler
    onDragStart(elementType);
  };

  return (
    <div className="space-y-2">
      {/* Basic Fields Category */}
      <div className="mb-3">
        <div className="text-sm font-semibold text-gray-500 mb-2">BASIC FIELDS</div>
        {BASIC_ELEMENTS.map((element, index) => (
          <div 
            key={index}
            className="bg-white border border-gray-300 rounded p-2 mb-2 cursor-move hover:bg-gray-50 flex items-center"
            draggable={true}
            data-element-type={element.type}
            onDragStart={(e) => handleDragStart(e, element.type)}
          >
            {getIcon(element.icon)}
            <span>{element.label}</span>
          </div>
        ))}
      </div>

      {/* Option Fields Category */}
      <div className="mb-3">
        <div className="text-sm font-semibold text-gray-500 mb-2">OPTION FIELDS</div>
        {OPTION_ELEMENTS.map((element, index) => (
          <div 
            key={index}
            className="bg-white border border-gray-300 rounded p-2 mb-2 cursor-move hover:bg-gray-50 flex items-center"
            draggable={true}
            data-element-type={element.type}
            onDragStart={(e) => handleDragStart(e, element.type)}
          >
            {getIcon(element.icon)}
            <span>{element.label}</span>
          </div>
        ))}
      </div>

      {/* Layout Elements */}
      <div className="mb-3">
        <div className="text-sm font-semibold text-gray-500 mb-2">LAYOUT</div>
        {LAYOUT_ELEMENTS.map((element, index) => (
          <div 
            key={index}
            className="bg-white border border-gray-300 rounded p-2 mb-2 cursor-move hover:bg-gray-50 flex items-center"
            draggable={true}
            data-element-type={element.type}
            onDragStart={(e) => handleDragStart(e, element.type)}
          >
            {getIcon(element.icon)}
            <span>{element.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
