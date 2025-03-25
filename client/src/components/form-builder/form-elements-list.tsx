import { BASIC_ELEMENTS, OPTION_ELEMENTS, LAYOUT_ELEMENTS } from "@/lib/constants";
import { 
  Type, 
  Hash, 
  Calendar, 
  AlignLeft, 
  ChevronDownSquare, 
  CircleDot, 
  CheckSquare, 
  ToggleLeft, 
  Square, 
  Columns, 
  Minus 
} from "lucide-react";

interface FormElementsListProps {
  onDragStart: (elementType: string) => void;
}

export function FormElementsList({ onDragStart }: FormElementsListProps) {
  // Helper function to get icon component by name
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "font": return <Type className="h-4 w-4 text-gray-500 mr-2" />;
      case "hashtag": return <Hash className="h-4 w-4 text-gray-500 mr-2" />;
      case "calendar": return <Calendar className="h-4 w-4 text-gray-500 mr-2" />;
      case "align-left": return <AlignLeft className="h-4 w-4 text-gray-500 mr-2" />;
      case "chevron-down-square": return <ChevronDownSquare className="h-4 w-4 text-gray-500 mr-2" />;
      case "circle-dot": return <CircleDot className="h-4 w-4 text-gray-500 mr-2" />;
      case "check-square": return <CheckSquare className="h-4 w-4 text-gray-500 mr-2" />;
      case "toggle-left": return <ToggleLeft className="h-4 w-4 text-gray-500 mr-2" />;
      case "square": return <Square className="h-4 w-4 text-gray-500 mr-2" />;
      case "columns": return <Columns className="h-4 w-4 text-gray-500 mr-2" />;
      case "minus": return <Minus className="h-4 w-4 text-gray-500 mr-2" />;
      default: return <Type className="h-4 w-4 text-gray-500 mr-2" />;
    }
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
            onDragStart={() => onDragStart(element.type)}
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
            onDragStart={() => onDragStart(element.type)}
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
            onDragStart={() => onDragStart(element.type)}
          >
            {getIcon(element.icon)}
            <span>{element.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
