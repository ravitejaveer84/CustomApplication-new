import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FormElement } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface GalleryProps {
  element: FormElement;
  formId: number;
  formData?: Record<string, any>;
}

export function Gallery({ element, formId, formData }: GalleryProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get data source ID from either format (direct or nested)
    const dataSourceId = element.dataSourceId || element.dataSource?.id;
    
    if (dataSourceId) {
      setLoading(true);
      setError(null);

      const fetchData = async () => {
        try {
          const response = await apiRequest<any[]>(
            `/api/datasources/${dataSourceId}/data`
          );

          if (response && Array.isArray(response)) {
            setItems(response);
          } else {
            setError("Invalid data format received");
          }
        } catch (err) {
          console.error("Error fetching gallery data:", err);
          setError("Failed to load gallery data");
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [element.dataSourceId, element.dataSource?.id]);

  if (loading) {
    return (
      <div className="w-full p-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-2 text-sm text-muted-foreground">Loading gallery items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
        <p>{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full p-4 border border-dashed rounded-md border-gray-300 text-center">
        <p className="text-sm text-muted-foreground">No items to display</p>
      </div>
    );
  }

  // Determine the grid layout based on the galleryLayout property
  const gridClass = element.galleryLayout === "list" 
    ? "grid grid-cols-1 gap-4" 
    : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4";

  // Get the column configuration - use columns if available, otherwise create from first item
  const columns = element.columns || Object.keys(items[0]).map(key => ({
    field: key,
    header: key,
    visible: true
  }));

  // Filter to only visible columns
  const visibleColumns = columns.filter((col: {field: string, header?: string, visible?: boolean}) => col.visible !== false);

  // Determine which field to use as primary display (first visible column)
  const primaryField = visibleColumns.length > 0 ? visibleColumns[0].field : Object.keys(items[0])[0];
  
  // Use the second field as secondary display if available
  const secondaryField = visibleColumns.length > 1 ? visibleColumns[1].field : null;

  return (
    <div className={gridClass}>
      {items.map((item, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-4">
            {/* Primary content (larger) */}
            <h3 className="text-lg font-medium truncate">
              {item[primaryField]}
            </h3>
            
            {/* Secondary content (if available) */}
            {secondaryField && (
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {item[secondaryField]}
              </p>
            )}
            
            {/* Additional fields */}
            <div className="mt-3 space-y-1">
              {visibleColumns.slice(2).map((column: {field: string, header?: string, visible?: boolean}, colIndex: number) => (
                <div key={colIndex} className="flex justify-between text-sm">
                  <span className="font-medium">{column.header || column.field}:</span>
                  <span>{item[column.field]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}