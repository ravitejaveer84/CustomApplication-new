import React, { useState, useEffect } from "react";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Pagination, PaginationContent, PaginationItem, 
  PaginationPrevious, PaginationNext, PaginationLink 
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormElement } from "@shared/schema";
import { Download, Search, ArrowUpDown, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface DataTableProps {
  element: FormElement;
  formId: number;
  formData?: Record<string, any>;
}

export function DataTable({ element, formId, formData }: DataTableProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [editingCell, setEditingCell] = useState<{rowIndex: number, field: string} | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const rowsPerPage = element.rowsPerPage || 10;
  const isSearchable = element.searchable !== false;
  const showPagination = element.pagination !== false;
  const isExportable = element.exportable === true;
  
  // Fetch data from data source
  useEffect(() => {
    // Get data source ID from either format (direct or nested)
    const dataSourceId = element.dataSourceId || element.dataSource?.id;
    
    // Make sure we have a data source connected to the element
    if (!dataSourceId) {
      setLoading(false);
      setError("No data source connected");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("Fetching data from source:", dataSourceId);
        
        const response = await apiRequest<any[]>(
          `/api/datasources/${dataSourceId}/data`
        );
        
        if (response && Array.isArray(response)) {
          console.log(`Received ${response.length} records from data source`);
          setData(response);
          setFilteredData(response);
        } else {
          setError("Invalid data format received");
          setData([]);
          setFilteredData([]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
        setData([]);
        setFilteredData([]);
      } finally {
        setLoading(false);
      }
    };

    if (dataSourceId) {
      fetchData();
    }
  }, [element.dataSourceId, element.dataSource?.id]);

  // Define column type for better type safety
  type TableColumn = {
    field: string;
    header?: string;
    visible?: boolean;
    sortable?: boolean;
    editable?: boolean;
    width?: number;
  };

  // Filter data based on search term
  useEffect(() => {
    if (!data.length || !searchTerm.trim()) {
      setFilteredData(data);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const filtered = data.filter(row => {
      return element.columns?.some((column: TableColumn) => {
        const value = row[column.field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTermLower);
      });
    });

    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page after filtering
  }, [searchTerm, data, element.columns]);

  // Sort data
  const handleSort = (field: string) => {
    // If clicking the same field, toggle direction
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Apply sorting
  useEffect(() => {
    if (!sortField) {
      return;
    }

    const sorted = [...filteredData].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      // Handle null/undefined values
      if (aValue === undefined || aValue === null) return sortDirection === "asc" ? -1 : 1;
      if (bValue === undefined || bValue === null) return sortDirection === "asc" ? 1 : -1;

      // Compare based on type
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      // Default string comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      return sortDirection === "asc" 
        ? aStr.localeCompare(bStr) 
        : bStr.localeCompare(aStr);
    });

    setFilteredData(sorted);
  }, [sortField, sortDirection]);

  // Export to Excel
  const handleExport = () => {
    // Get visible columns only
    const visibleColumns = element.columns?.filter((col: TableColumn) => col.visible !== false) || [];
    
    // Map data to only include visible columns
    const exportData = filteredData.map(row => {
      const newRow: Record<string, any> = {};
      visibleColumns.forEach((col: TableColumn) => {
        newRow[col.header || col.field] = row[col.field];
      });
      return newRow;
    });

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    
    // Generate filename
    const fileName = `${element.label || "table"}_export_${new Date().toISOString().split("T")[0]}.xlsx`;
    
    // Export file
    XLSX.writeFile(workbook, fileName);
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  // Handle page change
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // Visible columns
  const visibleColumns = element.columns?.filter((col: TableColumn) => col.visible !== false) || [];
  
  // Start editing a cell
  const startEditing = (rowIndex: number, field: string, value: any) => {
    // Convert the actual row index to the index in the paginated data
    const actualRowIndex = startIndex + rowIndex;
    
    setEditingCell({ rowIndex: actualRowIndex, field });
    setEditValue(value !== null && value !== undefined ? String(value) : "");
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue("");
  };
  
  // Save edited cell value
  const saveEditedCell = async () => {
    if (!editingCell) return;
    
    const { rowIndex, field } = editingCell;
    try {
      setSaving(true);
      
      // Get data source ID
      const dataSourceId = element.dataSourceId || element.dataSource?.id;
      if (!dataSourceId) {
        toast({
          title: "Error",
          description: "No data source connected to this table",
          variant: "destructive",
        });
        return;
      }
      
      // Get the current row
      const row = filteredData[rowIndex];
      if (!row) return;
      
      // Create an updated version of the row
      const updatedRow = { ...row, [field]: editValue };
      
      // Get the original index from the data array (this is needed for the API call)
      // If we can't find it in the data array, use the rowIndex as a fallback
      const originalIndex = data.findIndex(item => JSON.stringify(item) === JSON.stringify(row));
      const indexToUse = originalIndex !== -1 ? originalIndex : rowIndex;
      
      // Send update to the server
      const response = await apiRequest(
        `/api/datasources/${dataSourceId}/data/${indexToUse}`,
        {
          method: "PUT",
          data: updatedRow,
        }
      );
      
      if (!response || !response.success) {
        throw new Error(response?.message || "Unknown error");
      }
      
      // Update the local data
      const newData = [...filteredData];
      newData[rowIndex] = updatedRow;
      setFilteredData(newData);
      
      // Also update the full data array
      if (originalIndex !== -1) {
        const newFullData = [...data];
        newFullData[originalIndex] = updatedRow;
        setData(newFullData);
      }
      
      toast({
        title: "Success",
        description: "Value updated successfully",
      });
      
      // Reset the editing state
      setEditingCell(null);
      setEditValue("");
    } catch (error) {
      console.error("Error updating cell:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update the value",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full p-8 text-center">
        <div className="animate-pulse flex justify-center">
          <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
        </div>
        <div className="mt-2 animate-pulse flex justify-center">
          <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-md p-4 text-center text-red-500">
        <p>{error}</p>
        {!element.dataSourceId && (
          <p className="text-sm text-muted-foreground mt-2">
            Configure a data source for this table in the form builder
          </p>
        )}
      </div>
    );
  }

  if (!visibleColumns.length) {
    return (
      <div className="border rounded-md p-4 text-center">
        <p>No columns configured for this table</p>
      </div>
    );
  }

  if (!filteredData.length) {
    return (
      <div className="border rounded-md p-4 text-center">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Table title and controls */}
      <div className="flex justify-between items-center">
        {element.label && (
          <h3 className="text-lg font-semibold">{element.label}</h3>
        )}
        
        <div className="flex items-center gap-2">
          {isSearchable && (
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-8 w-[200px] h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
          
          {isExportable && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
              className="gap-1"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </div>
      
      {/* Data count badge */}
      <div>
        <Badge variant="outline" className="text-xs">
          {filteredData.length} {filteredData.length === 1 ? 'record' : 'records'}
        </Badge>
      </div>
      
      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((column: TableColumn) => (
                <TableHead 
                  key={column.field}
                  style={{width: column.width ? `${column.width}px` : 'auto'}}
                  className={column.sortable !== false ? "cursor-pointer select-none" : ""}
                  onClick={() => column.sortable !== false ? handleSort(column.field) : null}
                >
                  <div className="flex items-center gap-1">
                    <span>{column.header || column.field}</span>
                    {column.sortable !== false && (
                      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {visibleColumns.map((column: TableColumn) => {
                  const value = row[column.field];
                  const isEditing = 
                    editingCell !== null && 
                    editingCell.rowIndex === startIndex + rowIndex && 
                    editingCell.field === column.field;
                  
                  return (
                    <TableCell key={column.field}>
                      {isEditing ? (
                        <div className="flex items-center space-x-1">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-8 py-1"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                saveEditedCell();
                              } else if (e.key === 'Escape') {
                                cancelEditing();
                              }
                            }}
                          />
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8" 
                              onClick={saveEditedCell}
                              disabled={saving}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8" 
                              onClick={cancelEditing}
                              disabled={saving}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className={column.editable ? "cursor-pointer hover:bg-gray-50 p-1 rounded" : ""}
                            onClick={() => {
                              if (column.editable && !editingCell) {
                                startEditing(rowIndex, column.field, value);
                              }
                            }}
                        >
                          {value !== undefined && value !== null
                            ? String(value)
                            : ''}
                        </div>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="gap-1 h-8 w-8 p-0"
                aria-label="Go to previous page"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </Button>
            </PaginationItem>
            
            {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
              // Show pages around the current page
              const pageWindow = 2;
              let pageNum;
              
              if (totalPages <= 5) {
                // If 5 or fewer pages, show all pages
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                // If near start, show first 5 pages
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                // If near end, show last 5 pages
                pageNum = totalPages - 4 + i;
              } else {
                // Show 2 pages before and after current page
                pageNum = currentPage - pageWindow + i;
              }
              
              if (pageNum > 0 && pageNum <= totalPages) {
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink 
                      isActive={pageNum === currentPage}
                      onClick={() => goToPage(pageNum)}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              return null;
            })}
            
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="gap-1 h-8 w-8 p-0"
                aria-label="Go to next page"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}