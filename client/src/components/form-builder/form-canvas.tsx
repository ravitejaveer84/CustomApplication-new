import { useState, useRef, useEffect } from "react";
import { FormElement } from "@shared/schema";
import { getDefaultElement } from "@/lib/constants";
import { MoveVertical, Cog, Trash, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { nanoid } from "nanoid";

interface FormCanvasProps {
  formElements: FormElement[];
  onElementsChange: (elements: FormElement[]) => void;
  onElementSelect: (element: FormElement) => void;
  selectedElementId: string | null;
}

export function FormCanvas({ 
  formElements, 
  onElementsChange, 
  onElementSelect,
  selectedElementId 
}: FormCanvasProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };
  
  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    // Get the element type from dataTransfer
    const elementType = e.dataTransfer.getData("text/plain");
    if (!elementType) return;
    
    // Create a new element based on the type
    const newElement = getDefaultElement(elementType);
    
    // Add it to the form elements
    onElementsChange([...formElements, newElement]);
  };

  const handleDeleteElement = (elementId: string) => {
    const updatedElements = formElements.filter(el => el.id !== elementId);
    onElementsChange(updatedElements);
  };

  const renderFormElement = (element: FormElement) => {
    const isSelected = selectedElementId === element.id;
    
    switch (element.type) {
      case "text":
        return (
          <div className={`form-field-container relative group ${isSelected ? 'ring-2 ring-primary' : ''}`} onClick={() => onElementSelect(element)}>
            <div className="absolute top-2 right-2 flex space-x-1">
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <ArrowsUpDown className="h-3 w-3 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Cog className="h-3 w-3 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => {
                e.stopPropagation();
                handleDeleteElement(element.id);
              }}>
                <Trash className="h-3 w-3 text-red-500" />
              </Button>
            </div>
            <label className="block text-sm font-medium mb-1">
              {element.label} {element.required && <span className="text-red-500">*</span>}
            </label>
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary" 
              placeholder={element.placeholder || "Enter text"} 
              readOnly 
            />
            {element.helpText && <p className="text-xs text-gray-500 mt-1">{element.helpText}</p>}
          </div>
        );
      
      case "number":
        return (
          <div className={`form-field-container relative group ${isSelected ? 'ring-2 ring-primary' : ''}`} onClick={() => onElementSelect(element)}>
            <div className="absolute top-2 right-2 flex space-x-1">
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <ArrowsUpDown className="h-3 w-3 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Cog className="h-3 w-3 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => {
                e.stopPropagation();
                handleDeleteElement(element.id);
              }}>
                <Trash className="h-3 w-3 text-red-500" />
              </Button>
            </div>
            <label className="block text-sm font-medium mb-1">
              {element.label} {element.required && <span className="text-red-500">*</span>}
            </label>
            <input 
              type="number" 
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary" 
              placeholder={element.placeholder || "Enter number"} 
              readOnly 
            />
            {element.helpText && <p className="text-xs text-gray-500 mt-1">{element.helpText}</p>}
          </div>
        );
      
      case "date":
        return (
          <div className={`form-field-container relative group ${isSelected ? 'ring-2 ring-primary' : ''}`} onClick={() => onElementSelect(element)}>
            <div className="absolute top-2 right-2 flex space-x-1">
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <ArrowsUpDown className="h-3 w-3 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Cog className="h-3 w-3 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => {
                e.stopPropagation();
                handleDeleteElement(element.id);
              }}>
                <Trash className="h-3 w-3 text-red-500" />
              </Button>
            </div>
            <label className="block text-sm font-medium mb-1">
              {element.label} {element.required && <span className="text-red-500">*</span>}
            </label>
            <input 
              type="date" 
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary" 
              readOnly 
            />
            {element.helpText && <p className="text-xs text-gray-500 mt-1">{element.helpText}</p>}
          </div>
        );
      
      case "textarea":
        return (
          <div className={`form-field-container relative group ${isSelected ? 'ring-2 ring-primary' : ''}`} onClick={() => onElementSelect(element)}>
            <div className="absolute top-2 right-2 flex space-x-1">
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <ArrowsUpDown className="h-3 w-3 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Cog className="h-3 w-3 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => {
                e.stopPropagation();
                handleDeleteElement(element.id);
              }}>
                <Trash className="h-3 w-3 text-red-500" />
              </Button>
            </div>
            <label className="block text-sm font-medium mb-1">
              {element.label} {element.required && <span className="text-red-500">*</span>}
            </label>
            <textarea 
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary min-h-[80px]" 
              placeholder={element.placeholder || "Enter text here"} 
              readOnly 
            />
            {element.helpText && <p className="text-xs text-gray-500 mt-1">{element.helpText}</p>}
          </div>
        );
      
      case "dropdown":
        return (
          <div className={`form-field-container relative group ${isSelected ? 'ring-2 ring-primary' : ''}`} onClick={() => onElementSelect(element)}>
            <div className="absolute top-2 right-2 flex space-x-1">
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <ArrowsUpDown className="h-3 w-3 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Cog className="h-3 w-3 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => {
                e.stopPropagation();
                handleDeleteElement(element.id);
              }}>
                <Trash className="h-3 w-3 text-red-500" />
              </Button>
            </div>
            <label className="block text-sm font-medium mb-1">
              {element.label} {element.required && <span className="text-red-500">*</span>}
            </label>
            <select className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary">
              <option value="" disabled selected>Select an option</option>
              {element.options?.map((option, index) => (
                <option key={index} value={option.value}>{option.label}</option>
              ))}
            </select>
            {element.helpText && <p className="text-xs text-gray-500 mt-1">{element.helpText}</p>}
          </div>
        );
      
      case "radio":
        return (
          <div className={`form-field-container relative group ${isSelected ? 'ring-2 ring-primary' : ''}`} onClick={() => onElementSelect(element)}>
            <div className="absolute top-2 right-2 flex space-x-1">
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <ArrowsUpDown className="h-3 w-3 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Cog className="h-3 w-3 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => {
                e.stopPropagation();
                handleDeleteElement(element.id);
              }}>
                <Trash className="h-3 w-3 text-red-500" />
              </Button>
            </div>
            <label className="block text-sm font-medium mb-1">
              {element.label} {element.required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              {element.options?.map((option, index) => (
                <label key={index} className="flex items-center">
                  <input type="radio" name={element.name} className="mr-2" value={option.value} />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {element.helpText && <p className="text-xs text-gray-500 mt-1">{element.helpText}</p>}
          </div>
        );
      
      case "checkbox":
        return (
          <div className={`form-field-container relative group ${isSelected ? 'ring-2 ring-primary' : ''}`} onClick={() => onElementSelect(element)}>
            <div className="absolute top-2 right-2 flex space-x-1">
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <ArrowsUpDown className="h-3 w-3 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Cog className="h-3 w-3 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => {
                e.stopPropagation();
                handleDeleteElement(element.id);
              }}>
                <Trash className="h-3 w-3 text-red-500" />
              </Button>
            </div>
            <label className="block text-sm font-medium mb-1">
              {element.label} {element.required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              {element.options?.map((option, index) => (
                <label key={index} className="flex items-center">
                  <input type="checkbox" className="mr-2" value={option.value} />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {element.helpText && <p className="text-xs text-gray-500 mt-1">{element.helpText}</p>}
          </div>
        );
      
      case "toggle":
        return (
          <div className={`form-field-container relative group ${isSelected ? 'ring-2 ring-primary' : ''}`} onClick={() => onElementSelect(element)}>
            <div className="absolute top-2 right-2 flex space-x-1">
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <ArrowsUpDown className="h-3 w-3 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Cog className="h-3 w-3 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => {
                e.stopPropagation();
                handleDeleteElement(element.id);
              }}>
                <Trash className="h-3 w-3 text-red-500" />
              </Button>
            </div>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="toggle" />
              <span className="text-sm font-medium">
                {element.label} {element.required && <span className="text-red-500">*</span>}
              </span>
            </label>
            {element.helpText && <p className="text-xs text-gray-500 mt-1">{element.helpText}</p>}
          </div>
        );
      
      case "section":
        return (
          <div 
            className={`mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50 relative ${isSelected ? 'ring-2 ring-primary' : ''}`} 
            onClick={() => onElementSelect(element)}
          >
            <div className="absolute top-2 right-2 flex space-x-1">
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <ArrowsUpDown className="h-3 w-3 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Cog className="h-3 w-3 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => {
                e.stopPropagation();
                handleDeleteElement(element.id);
              }}>
                <Trash className="h-3 w-3 text-red-500" />
              </Button>
            </div>
            <h3 className="text-lg font-semibold mb-4">{element.label}</h3>
            
            {element.elements && element.elements.length > 0 ? (
              <div className="space-y-4">
                {element.elements.map(childElement => (
                  <div key={childElement.id} className="p-2">
                    {renderFormElement(childElement)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Plus className="h-5 w-5 mx-auto mb-2" />
                  <p>Drag elements here</p>
                </div>
              </div>
            )}
          </div>
        );
      
      case "column":
        return (
          <div 
            className={`mb-8 relative ${isSelected ? 'ring-2 ring-primary' : ''}`}
            onClick={() => onElementSelect(element)}
          >
            <div className="absolute top-2 right-2 flex space-x-1 z-10">
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <ArrowsUpDown className="h-3 w-3 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Cog className="h-3 w-3 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => {
                e.stopPropagation();
                handleDeleteElement(element.id);
              }}>
                <Trash className="h-3 w-3 text-red-500" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {element.columns?.map((column, index) => (
                <div key={column.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h4 className="text-sm font-medium mb-2">Column {index + 1}</h4>
                  
                  {column.elements && column.elements.length > 0 ? (
                    <div className="space-y-4">
                      {column.elements.map(childElement => (
                        <div key={childElement.id} className="p-2">
                          {renderFormElement(childElement)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <Plus className="h-5 w-5 mx-auto mb-2" />
                        <p>Drag elements here</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      
      case "divider":
        return (
          <div 
            className={`my-6 relative ${isSelected ? 'ring-2 ring-primary' : ''}`}
            onClick={() => onElementSelect(element)}
          >
            <div className="absolute top-0 right-0 flex space-x-1">
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <ArrowsUpDown className="h-3 w-3 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Cog className="h-3 w-3 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => {
                e.stopPropagation();
                handleDeleteElement(element.id);
              }}>
                <Trash className="h-3 w-3 text-red-500" />
              </Button>
            </div>
            <hr className="border-t border-gray-300" />
            {element.label && <p className="text-xs text-gray-500 text-center mt-1">{element.label}</p>}
          </div>
        );
      
      default:
        return <div>Unknown element type: {element.type}</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6 min-h-[600px]">
      {/* Form Header */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-semibold">Form Preview</h2>
        <p className="text-gray-500">Drag and drop elements to build your form</p>
      </div>
      
      {/* Render form elements */}
      {formElements.length > 0 ? (
        <div className="space-y-6">
          {formElements.map(element => (
            <div key={element.id}>
              {renderFormElement(element)}
            </div>
          ))}
        </div>
      ) : null}
      
      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        className={`border-2 border-dashed ${isDraggingOver ? 'border-primary bg-blue-50' : 'border-gray-300'} rounded-lg p-8 flex items-center justify-center mt-6`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center text-gray-500">
          <Plus className="h-6 w-6 mx-auto mb-2" />
          <p>Drag and drop form elements here</p>
        </div>
      </div>
    </div>
  );
}
