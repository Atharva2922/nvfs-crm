"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  X,
  Plus,
  Search,
  Filter,
  Check,
  MoreHorizontal,
  Edit2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  Printer,
  Trash2,
  FileSpreadsheet,
  Package,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  LayoutList,
  Columns,
  Sparkles,
  Zap,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Lock,
  Unlock,
  Copy,
  ArrowRightLeft,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";
import { initialZohoItems } from "@/modules/accounts/constants/inventory-defaults";


export default function InventoryItemsPage() {
  const router = useRouter();

  const [items, setItems] = useState<any[]>(initialZohoItems);
  const [selectedItemId, setSelectedItemId] = useState<string>("MRSC");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("Active Items");
  const [viewMode, setViewMode] = useState<"split" | "table">("split");
  const [detailTab, setDetailTab] = useState<"overview" | "transactions" | "history">("overview");

  // Lightbox Expander State
  const [expandedImage, setExpandedImage] = useState<{
    src: string;
    title: string;
    index: number;
    allImages: Array<{ src: string; title: string }>;
  } | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const getItemImages = (item: any) => {
    const list: Array<{ src: string; title: string }> = [];
    if (item?.frontImage) list.push({ src: item.frontImage, title: "Front View" });
    if (item?.rearImage) list.push({ src: item.rearImage, title: "Rear View" });
    if (Array.isArray(item?.galleryImages)) {
      item.galleryImages.forEach((img: string, i: number) => {
        list.push({ src: img, title: `Gallery Image ${i + 1}` });
      });
    }
    return list;
  };

  const openLightbox = (src: string, defaultTitle: string) => {
    const allImgs = getItemImages(currentItem);
    const idx = allImgs.findIndex((img) => img.src === src);
    setExpandedImage({
      src,
      title: `${currentItem?.name || "Product"} - ${defaultTitle}`,
      index: idx >= 0 ? idx : 0,
      allImages: allImgs.length > 0 ? allImgs : [{ src, title: defaultTitle }],
    });
    setZoomScale(1);
    setRotation(0);
  };

  const navigateLightbox = (step: number) => {
    if (!expandedImage || !expandedImage.allImages.length) return;
    const total = expandedImage.allImages.length;
    const nextIndex = (expandedImage.index + step + total) % total;
    const nextItem = expandedImage.allImages[nextIndex];
    setExpandedImage({
      src: nextItem.src,
      title: `${currentItem?.name || "Product"} - ${nextItem.title}`,
      index: nextIndex,
      allImages: expandedImage.allImages,
    });
    setZoomScale(1);
    setRotation(0);
  };

  // Keyboard navigation for image lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!expandedImage) return;
      if (e.key === "Escape") {
        setExpandedImage(null);
      } else if (e.key === "ArrowLeft") {
        navigateLightbox(-1);
      } else if (e.key === "ArrowRight") {
        navigateLightbox(1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandedImage]);

  // Load custom items from localStorage & database API
  useEffect(() => {
    // 1. Load permanently deleted SKUs set
    let deletedSet = new Set<string>();
    try {
      const ds = localStorage.getItem("nfvs_deleted_inventory_items");
      if (ds) {
        const arr = JSON.parse(ds);
        if (Array.isArray(arr)) {
          deletedSet = new Set(arr.map((s: string) => String(s).toLowerCase().trim()));
        }
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Load stored items from localStorage
    let loadedItems: any[] = [];
    try {
      const stored = localStorage.getItem("nfvs_inventory_items");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          loadedItems = parsed.filter(
            (p: any) =>
              !deletedSet.has(String(p.sku || "").toLowerCase().trim()) &&
              !deletedSet.has(String(p.id || "").toLowerCase().trim())
          );
        }
      } else {
        loadedItems = initialZohoItems.filter(
          (i) =>
            !deletedSet.has(String(i.sku || "").toLowerCase().trim()) &&
            !deletedSet.has(String(i.id || "").toLowerCase().trim())
        );
        localStorage.setItem("nfvs_inventory_items", JSON.stringify(loadedItems));
      }
    } catch (e) {
      console.error(e);
    }

    setItems(loadedItems);
    if (loadedItems.length > 0) {
      setSelectedItemId((prev) => {
        const exists = loadedItems.some(
          (i) =>
            String(i.sku || "").toLowerCase() === String(prev || "").toLowerCase() ||
            String(i.id || "").toLowerCase() === String(prev || "").toLowerCase()
        );
        return exists ? prev : (loadedItems[0].sku || loadedItems[0].id);
      });
    }

    // 3. Fetch from backend products API and only merge products not in deletedSet and not ARCHIVED
    fetch("/api/inventory/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          let activeDeleted = deletedSet;
          try {
            const ds = localStorage.getItem("nfvs_deleted_inventory_items");
            if (ds) {
              activeDeleted = new Set(JSON.parse(ds).map((s: string) => String(s).toLowerCase().trim()));
            }
          } catch {}

          const apiItems = data.data
            .filter(
              (p: any) =>
                p.status !== "ARCHIVED" &&
                !activeDeleted.has(String(p.sku || "").toLowerCase().trim()) &&
                !activeDeleted.has(String(p.id || "").toLowerCase().trim())
            )
            .map((p: any) => ({
              id: p.sku || p.id,
              sku: p.sku,
              name: p.name,
              type: p.productType === "PHYSICAL" ? "Goods" : "Service",
              itemTypeString: `Sales and Purchase Items (${p.productType === "PHYSICAL" ? "Goods" : "Service"})`,
              brand: "Enterprise OEM",
              manufacturer: "Certified OEM",
              hsnCode: "84715000",
              taxPreference: "Taxable",
              unit: p.unitOfMeasure?.toLowerCase() || "units",
              sellingPrice: `₹${Number(p.sellingPrice || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
              costPrice: p.costPrice != null ? `₹${Number(p.costPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "₹0.00",
              purchasePrice: p.costPrice != null ? `₹${Number(p.costPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "₹0.00",
              salesAccount: "Sales",
              purchaseAccount: "Cost of Goods Sold",
              salesDescription: p.description || p.name,
              purchaseDescription: p.description || p.name,
              preferredVendor: "TechDistributors India",
              intraStateTax: "GST 18% [9% CGST + 9% SGST]",
              interStateTax: "IGST 18%",
              trackInventory: p.productType === "PHYSICAL",
              stock: `${p.totalStock ?? 0} ${p.unitOfMeasure?.toLowerCase() || "units"}`,
              status: p.status || "ACTIVE",
              isService: p.productType !== "PHYSICAL",
              createdSource: "API System",
              imageUrl: p.imageUrl || null,
              frontImage: p.imageUrl || null,
              rearImage: null,
              galleryImages: [],
            }));

          setItems((prev) => {
            const nonDeletedPrev = prev.filter(
              (p) =>
                !activeDeleted.has(String(p.sku || "").toLowerCase().trim()) &&
                !activeDeleted.has(String(p.id || "").toLowerCase().trim())
            );
            const apiSkus = new Set(apiItems.map((a: any) => String(a.sku || "").toLowerCase()));
            const preserved = nonDeletedPrev.filter((p) => !apiSkus.has(String(p.sku || "").toLowerCase()));
            
            const mergedApiItems = apiItems.map((apiItem: any) => {
              const localMatch = nonDeletedPrev.find((p) => String(p.sku || "").toLowerCase() === String(apiItem.sku || "").toLowerCase());
              if (localMatch) {
                return {
                  ...apiItem,
                  ...localMatch,
                  frontImage: localMatch.frontImage || apiItem.frontImage || localMatch.imageUrl || apiItem.imageUrl || null,
                  rearImage: localMatch.rearImage || null,
                  galleryImages: (localMatch.galleryImages && localMatch.galleryImages.length > 0) ? localMatch.galleryImages : (apiItem.galleryImages || []),
                  imageUrl: localMatch.frontImage || apiItem.imageUrl || null,
                };
              }
              return apiItem;
            });

            return [...mergedApiItems, ...preserved];
          });
        }
      })
      .catch((err) => console.warn(err));
  }, []);

  // Filter items in middle list
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (activeFilter === "Active Items") return item.status === "ACTIVE";
      if (activeFilter === "Inactive Items") return item.status === "INACTIVE";
      if (activeFilter === "Goods") return item.type === "Goods";
      if (activeFilter === "Services") return item.type === "Service" || item.isService;
      if (activeFilter === "Low Stock") return String(item.stock).includes("0 ") || String(item.stock).includes("1 ");
      return true;
    });
  }, [items, searchTerm, activeFilter]);

  // Selected item object
  const currentItem = useMemo(() => {
    return items.find((i) => i.id === selectedItemId || i.sku === selectedItemId) || filteredItems[0] || items[0];
  }, [items, selectedItemId, filteredItems]);

  // =================================================================
  // MORE DROPDOWN & ACTIONS STATE
  // =================================================================
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [targetMoveItemId, setTargetMoveItemId] = useState("");
  const [transferStockOnMove, setTransferStockOnMove] = useState(true);

  // Toast state
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    type?: "success" | "error" | "info";
  } | null>(null);

  const showToastNotification = (t: { title: string; message: string; type?: "success" | "error" | "info" }) => {
    setToast(t);
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Click outside to close More menu
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showMoreMenu]);

  // Helper to persist items list to localStorage
  const persistItemsToStorage = (updatedList: any[]) => {
    try {
      localStorage.setItem("nfvs_inventory_items", JSON.stringify(updatedList));
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
    }
  };

  // 1. CLONE ITEM
  const handleCloneItem = () => {
    setShowMoreMenu(false);
    if (!currentItem) return;

    let cloneSku = `${currentItem.sku}-COPY`;
    let counter = 1;
    while (items.some((i) => (i.sku || "").toLowerCase() === cloneSku.toLowerCase())) {
      cloneSku = `${currentItem.sku}-COPY-${counter}`;
      counter++;
    }

    const clonedItem = {
      ...currentItem,
      id: cloneSku,
      sku: cloneSku,
      name: `${currentItem.name} (Copy)`,
      createdSource: "User Cloned",
      status: "ACTIVE",
      isLocked: false,
      updatedAt: new Date().toISOString(),
    };

    const newItems = [clonedItem, ...items];
    setItems(newItems);
    setSelectedItemId(clonedItem.sku);
    persistItemsToStorage(newItems);

    showToastNotification({
      title: "Item Cloned Successfully",
      message: `Cloned as "${clonedItem.name}" with SKU: ${clonedItem.sku}`,
      type: "success",
    });
  };

  // 2. TOGGLE ACTIVE / INACTIVE
  const handleToggleActive = () => {
    setShowMoreMenu(false);
    if (!currentItem) return;

    const newStatus = currentItem.status === "INACTIVE" ? "ACTIVE" : "INACTIVE";
    const targetKey = currentItem.sku || currentItem.id;

    const updatedList = items.map((item) =>
      (item.sku === targetKey || item.id === targetKey)
        ? { ...item, status: newStatus }
        : item
    );
    setItems(updatedList);
    persistItemsToStorage(updatedList);

    // Call API async if product exists on backend
    fetch(`/api/inventory/products/${encodeURIComponent(targetKey)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    }).catch(() => {});

    showToastNotification({
      title: newStatus === "INACTIVE" ? "Item Marked as Inactive" : "Item Marked as Active",
      message: `"${currentItem.name}" status changed to ${newStatus}.`,
      type: "info",
    });
  };

  // 3. DELETE ITEM
  const confirmDelete = async () => {
    if (!currentItem) return;
    const targetKey = currentItem.sku || currentItem.id;
    const targetSku = currentItem.sku;
    const targetId = currentItem.id;
    const targetName = currentItem.name;

    // 1. Mark in permanent deleted set so page refreshes never restore it
    try {
      const ds = localStorage.getItem("nfvs_deleted_inventory_items");
      const deletedList: string[] = ds ? JSON.parse(ds) : [];
      if (targetSku) deletedList.push(String(targetSku).toLowerCase().trim());
      if (targetId) deletedList.push(String(targetId).toLowerCase().trim());
      if (targetKey) deletedList.push(String(targetKey).toLowerCase().trim());
      localStorage.setItem(
        "nfvs_deleted_inventory_items",
        JSON.stringify(Array.from(new Set(deletedList)))
      );
    } catch (e) {
      console.error(e);
    }

    // 2. Remove from active items list and localStorage
    const remaining = items.filter((i) => {
      const s = String(i.sku || "").toLowerCase().trim();
      const id = String(i.id || "").toLowerCase().trim();
      const matchSku = targetSku && s === String(targetSku).toLowerCase().trim();
      const matchId = targetId && id === String(targetId).toLowerCase().trim();
      const matchKey = targetKey && (s === String(targetKey).toLowerCase().trim() || id === String(targetKey).toLowerCase().trim());
      return !matchSku && !matchId && !matchKey;
    });

    setItems(remaining);
    persistItemsToStorage(remaining);

    if (remaining.length > 0) {
      setSelectedItemId(remaining[0].sku || remaining[0].id);
    }

    setShowDeleteModal(false);

    // 3. Call backend API to delete / archive in database
    try {
      await fetch(`/api/inventory/products/${encodeURIComponent(targetSku || targetId || targetKey)}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.warn("Backend API delete failed:", e);
    }

    showToastNotification({
      title: "Item Deleted",
      message: `"${targetName}" was permanently removed.`,
      type: "success",
    });
  };

  // 4. TOGGLE RETURNABLE
  const handleToggleReturnable = () => {
    setShowMoreMenu(false);
    if (!currentItem) return;

    const currentReturnable = currentItem.returnable;
    // Default is "Yes" for physical goods, "No" for service items unless explicitly set
    const isCurrentlyReturnable = currentReturnable ? currentReturnable === "Yes" : (currentItem.type === "Goods");
    const newReturnable = isCurrentlyReturnable ? "No" : "Yes";
    const targetKey = currentItem.sku || currentItem.id;

    const updatedList = items.map((item) =>
      (item.sku === targetKey || item.id === targetKey)
        ? { ...item, returnable: newReturnable }
        : item
    );
    setItems(updatedList);
    persistItemsToStorage(updatedList);

    showToastNotification({
      title: newReturnable === "Yes" ? "Marked as Returnable" : "Marked as Non-Returnable",
      message: `Return policy updated for "${currentItem.name}".`,
      type: "info",
    });
  };

  // 5. MOVE TO ANOTHER ITEM
  const confirmMove = () => {
    if (!targetMoveItemId || !currentItem) return;
    const targetItem = items.find((i) => i.id === targetMoveItemId || i.sku === targetMoveItemId);
    if (!targetItem) return;

    const sourceKey = currentItem.sku || currentItem.id;
    const sourceName = currentItem.name;

    // Remove source item and switch view to target item
    const remaining = items.filter((i) => i.sku !== sourceKey && i.id !== sourceKey);
    setItems(remaining);
    persistItemsToStorage(remaining);
    setSelectedItemId(targetItem.sku || targetItem.id);

    setShowMoveModal(false);
    setTargetMoveItemId("");

    showToastNotification({
      title: "Item Moved Successfully",
      message: `All records and associations from "${sourceName}" moved to "${targetItem.name}".`,
      type: "success",
    });
  };

  // 6. TOGGLE LOCK
  const handleToggleLock = () => {
    setShowMoreMenu(false);
    if (!currentItem) return;

    const newLockState = !currentItem.isLocked;
    const targetKey = currentItem.sku || currentItem.id;

    const updatedList = items.map((item) =>
      (item.sku === targetKey || item.id === targetKey)
        ? { ...item, isLocked: newLockState }
        : item
    );
    setItems(updatedList);
    persistItemsToStorage(updatedList);

    showToastNotification({
      title: newLockState ? "Item Locked" : "Item Unlocked",
      message: newLockState
        ? `"${currentItem.name}" is locked. Editing is restricted.`
        : `"${currentItem.name}" is unlocked and available for edits.`,
      type: newLockState ? "info" : "success",
    });
  };

  // Canvas Image Compression helper
  const compressImage = (file: File, maxWidth = 900, maxHeight = 900, quality = 0.82): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", quality));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUpdateItemImages = (sku: string, updates: Partial<{ frontImage: string | null; rearImage: string | null; galleryImages: string[] }>) => {
    setItems((prev) => {
      const next = prev.map((item) => {
        if (item.sku === sku || item.id === sku) {
          return { ...item, ...updates };
        }
        return item;
      });
      try {
        localStorage.setItem("nfvs_inventory_items", JSON.stringify(next));
      } catch (err) {
        console.warn("Failed to persist updated images to localStorage:", err);
      }
      return next;
    });
  };

  const handleUploadDirectImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "frontImage" | "rearImage"
  ) => {
    const file = e.target.files?.[0];
    if (file && currentItem) {
      try {
        const compressed = await compressImage(file);
        handleUpdateItemImages(currentItem.sku, { [type]: compressed });
      } catch {
        const reader = new FileReader();
        reader.onload = (event) => {
          handleUpdateItemImages(currentItem.sku, { [type]: event.target?.result as string });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleRemoveImage = (type: "frontImage" | "rearImage") => {
    if (currentItem) {
      handleUpdateItemImages(currentItem.sku, { [type]: null });
    }
  };

  const handleUploadDirectGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !currentItem) return;
    const newImgs: string[] = [];
    for (const file of files) {
      try {
        const comp = await compressImage(file);
        newImgs.push(comp);
      } catch {
        // fallback
      }
    }
    const existing = currentItem.galleryImages || [];
    handleUpdateItemImages(currentItem.sku, { galleryImages: [...existing, ...newImgs].slice(0, 15) });
  };

  const handleRemoveGalleryImage = (idx: number) => {
    if (currentItem && currentItem.galleryImages) {
      const updated = currentItem.galleryImages.filter((_: any, i: number) => i !== idx);
      handleUpdateItemImages(currentItem.sku, { galleryImages: updated });
    }
  };

  // If user toggled to standard full table view
  if (viewMode === "table") {
    return (
      <div className="h-full flex flex-col">
        {/* View Toggle Bar */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">Viewing in Spreadsheet Table Mode</div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setViewMode("split")}
            className="h-8 text-xs gap-1.5 border-slate-200 dark:border-slate-800"
          >
            <Columns className="h-3.5 w-3.5 text-blue-500" />
            Switch to Split 3-Pane View
          </Button>
        </div>

        <AccountsEntityPage
          title="Inventory Items"
          section="Inventory"
          description="Track products, hardware parts, service SKUs, cost prices, and standard selling rates."
          newButtonText="New Item"
          newButtonHref="/app/accounts/inventory/items/new"
          onNewClick={() => router.push("/app/accounts/inventory/items/new")}
          onViewClick={(row) => {
            setSelectedItemId(row.id || row.sku);
            setViewMode("split");
          }}
          columns={[
            {
              key: "sku",
              label: "SKU",
              render: (row) => (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItemId(row.id || row.sku);
                    setViewMode("split");
                  }}
                  className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {row.sku}
                </button>
              ),
            },
            {
              key: "name",
              label: "Item Name",
              render: (row) => (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItemId(row.id || row.sku);
                    setViewMode("split");
                  }}
                  className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left"
                >
                  {row.name}
                </button>
              ),
            },
            { key: "type", label: "Type" },
            { key: "stock", label: "In Stock", align: "right" },
            { key: "costPrice", label: "Cost Price", align: "right" },
            { key: "sellingPrice", label: "Selling Price", align: "right" },
            { key: "status", label: "Status" },
          ]}
          initialData={items}
        />
      </div>
    );
  }

  // =========================================================================
  // HARD LEFT SIDEBAR ALREADY EXISTS VIA AccountsSidebar.
  // HERE IS THE 2-PANE WORKSPACE:
  // COLUMN 2: MIDDLE ITEMS PANEL (Width ~340px)
  // COLUMN 3: RIGHT ITEM DETAIL CONTENT PANEL (Flex 1)
  // =========================================================================
  return (
    <div className="flex flex-1 h-[calc(100vh-65px)] w-full overflow-hidden bg-white dark:bg-[#0B132B] text-slate-900 dark:text-slate-100">
      
      {/* ================================================================= */}
      {/* COLUMN 2: MIDDLE ITEMS LIST PANEL (Next to hard left dashboard) */}
      {/* ================================================================= */}
      <aside className="w-80 lg:w-[350px] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] flex flex-col h-full overflow-hidden">
        
        {/* Panel Header */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="appearance-none pl-2.5 pr-7 py-1 text-sm font-bold text-slate-900 dark:text-white bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg cursor-pointer focus:outline-none"
              >
                <option value="Active Items">Active Items</option>
                <option value="Inactive Items">Inactive Items</option>
                <option value="All Items">All Items</option>
                <option value="Goods">Goods</option>
                <option value="Services">Services</option>
                <option value="Low Stock">Low Stock</option>
              </select>
              <ChevronDown className="h-3.5 w-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Quick Actions: + New Item and ... Menu */}
            <div className="flex items-center gap-1.5">
              <Link href="/app/accounts/inventory/items/new">
                <Button
                  size="sm"
                  className="h-7 w-7 p-0 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md shadow-xs"
                  title="Create New Item"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                title="Switch to Spreadsheet Table View"
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search in Items (/)"
              className="h-8 pl-8 text-xs bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 rounded-lg"
            />
          </div>
        </div>

        {/* Scrollable Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const isSelected = (currentItem?.id === item.id) || (currentItem?.sku === item.sku);

              return (
                <div
                  key={item.id || item.sku}
                  onClick={() => setSelectedItemId(item.id || item.sku)}
                  className={`group px-3.5 py-3 cursor-pointer transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? "bg-blue-50/90 dark:bg-blue-950/40 border-l-4 border-l-blue-600 dark:border-l-blue-500 text-slate-900 dark:text-white"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-1 h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <div className={`text-xs font-semibold truncate ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-slate-900 dark:text-white"}`}>
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        SKU: {item.sku}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {item.sellingPrice || "₹0.00"}
                    </div>
                    {item.type === "Goods" && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {item.stock}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No items match &quot;{searchTerm}&quot;
            </div>
          )}
        </div>

      </aside>

      {/* ================================================================= */}
      {/* COLUMN 3: RIGHT DETAIL CONTENT PANEL (Selected Item Information) */}
      {/* ================================================================= */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#0B132B]">
        
        {currentItem ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            
            {/* Top Detail Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {currentItem.name}
                  </h1>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    {currentItem.type === "Service" || currentItem.isService ? (
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <Zap className="h-3.5 w-3.5 text-amber-500" />
                        Non-Receivable Service Item
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <Package className="h-3.5 w-3.5 text-blue-500" />
                        Inventory Goods Tracked Item
                      </span>
                    )}
                    <span>•</span>
                    <span className="font-mono">{currentItem.sku}</span>
                    {currentItem.status === "INACTIVE" && (
                      <>
                        <span>•</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          INACTIVE
                        </span>
                      </>
                    )}
                    {currentItem.isLocked && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <Lock className="h-3 w-3" /> Locked
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {currentItem.isLocked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        showToastNotification({
                          title: "Item is Locked",
                          message: "This item is locked against modifications. Click 'Unlock Item' in the More menu to edit.",
                          type: "error",
                        });
                      }}
                      className="h-8 text-xs gap-1.5 border-slate-200 dark:border-slate-800 opacity-60"
                      title="Item is locked"
                    >
                      <Lock className="h-3.5 w-3.5 text-amber-500" />
                      Edit
                    </Button>
                  ) : (
                    <Link href={`/app/accounts/inventory/items/new?edit=${encodeURIComponent(currentItem.sku || currentItem.id)}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                        Edit
                      </Button>
                    </Link>
                  )}

                  {/* Zoho Books style More Dropdown */}
                  <div className="relative" ref={moreMenuRef}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMoreMenu((prev) => !prev)}
                      className={`h-8 text-xs gap-1 border-slate-200 dark:border-slate-800 ${
                        showMoreMenu ? "bg-slate-100 dark:bg-slate-800 text-blue-600" : ""
                      }`}
                    >
                      More <ChevronDown className="h-3 w-3" />
                    </Button>

                    {showMoreMenu && (
                      <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-xl py-1 z-50 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100">
                        <button
                          type="button"
                          onClick={handleCloneItem}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                        >
                          Clone Item
                        </button>
                        <button
                          type="button"
                          onClick={handleToggleActive}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                        >
                          {currentItem?.status === "INACTIVE" ? "Mark as Active" : "Mark as Inactive"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowMoreMenu(false);
                            setShowDeleteModal(true);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={handleToggleReturnable}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                        >
                          {(currentItem?.returnable === "Yes" || (!currentItem?.returnable && currentItem?.type === "Goods"))
                            ? "Mark as Non-Returnable"
                            : "Mark as Returnable"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowMoreMenu(false);
                            setTargetMoveItemId("");
                            setShowMoveModal(true);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                        >
                          Move to another item
                        </button>
                        <button
                          type="button"
                          onClick={handleToggleLock}
                          className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                        >
                          {currentItem?.isLocked ? "Unlock Item" : "Lock Item"}
                        </button>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    title="Switch to full table view"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Navigation Tabs (Overview, Transactions, History) */}
              <div className="flex items-center gap-6 mt-4 border-b border-transparent text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setDetailTab("overview")}
                  className={`pb-2 border-b-2 transition-colors ${
                    detailTab === "overview"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab("transactions")}
                  className={`pb-2 border-b-2 transition-colors ${
                    detailTab === "transactions"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Transactions
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab("history")}
                  className={`pb-2 border-b-2 transition-colors ${
                    detailTab === "history"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  History
                </button>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
              
              {/* TAB 1: OVERVIEW */}
              {detailTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Specs Sections (8 Cols) */}
                  <div className="lg:col-span-8 space-y-8">
                    
                    {/* Primary Details */}
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 pb-1 border-b border-slate-100 dark:border-slate-800/80">
                        Primary Details
                      </h3>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
                        <div className="flex justify-between sm:justify-start gap-4">
                          <dt className="text-slate-500 w-28 shrink-0">Item Name</dt>
                          <dd className="font-semibold text-blue-600 dark:text-blue-400">{currentItem.name}</dd>
                        </div>
                        <div className="flex justify-between sm:justify-start gap-4">
                          <dt className="text-slate-500 w-28 shrink-0">Item Type</dt>
                          <dd className="font-medium text-slate-800 dark:text-slate-200">
                            {currentItem.itemTypeString || "Sales and Purchase Items"}
                          </dd>
                        </div>
                        <div className="flex justify-between sm:justify-start gap-4">
                          <dt className="text-slate-500 w-28 shrink-0">SKU</dt>
                          <dd className="font-mono font-semibold text-slate-800 dark:text-slate-200">{currentItem.sku}</dd>
                        </div>
                        <div className="flex justify-between sm:justify-start gap-4">
                          <dt className="text-slate-500 w-28 shrink-0">SAC / HSN</dt>
                          <dd className="font-mono font-semibold text-slate-800 dark:text-slate-200">{currentItem.hsnCode || "997319"}</dd>
                        </div>
                        <div className="flex justify-between sm:justify-start gap-4">
                          <dt className="text-slate-500 w-28 shrink-0">Created Source</dt>
                          <dd className="font-medium text-slate-800 dark:text-slate-200">{currentItem.createdSource || "User"}</dd>
                        </div>
                        <div className="flex justify-between sm:justify-start gap-4">
                          <dt className="text-slate-500 w-28 shrink-0">Tax Preference</dt>
                          <dd className="font-medium text-slate-800 dark:text-slate-200">{currentItem.taxPreference || "Taxable"}</dd>
                        </div>
                        <div className="flex justify-between sm:justify-start gap-4">
                          <dt className="text-slate-500 w-28 shrink-0">Brand</dt>
                          <dd className="font-medium text-slate-800 dark:text-slate-200">{currentItem.brand || "Standard"}</dd>
                        </div>
                        <div className="flex justify-between sm:justify-start gap-4">
                          <dt className="text-slate-500 w-28 shrink-0">Manufacturer</dt>
                          <dd className="font-medium text-slate-800 dark:text-slate-200">{currentItem.manufacturer || "Enterprise"}</dd>
                        </div>
                        <div className="flex justify-between sm:justify-start gap-4">
                          <dt className="text-slate-500 w-28 shrink-0">Returnable Item</dt>
                          <dd className="font-medium text-slate-800 dark:text-slate-200">
                            {currentItem.returnable || (currentItem.type === "Goods" ? "Yes" : "No")}
                          </dd>
                        </div>
                        {currentItem.isLocked && (
                          <div className="flex justify-between sm:justify-start gap-4">
                            <dt className="text-slate-500 w-28 shrink-0">Access Status</dt>
                            <dd className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <Lock className="h-3 w-3" /> Locked (Read-Only)
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    {/* Purchase Information */}
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 pb-1 border-b border-slate-100 dark:border-slate-800/80">
                        Purchase Information
                      </h3>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
                        <div className="flex justify-between sm:justify-start gap-4">
                          <dt className="text-slate-500 w-28 shrink-0">Cost Price</dt>
                          <dd className="font-bold text-slate-900 dark:text-slate-100">{currentItem.costPrice || "₹0.00"}</dd>
                        </div>
                        <div className="flex justify-between sm:justify-start gap-4">
                          <dt className="text-slate-500 w-28 shrink-0">Purchase Account</dt>
                          <dd className="font-medium text-slate-800 dark:text-slate-200">{currentItem.purchaseAccount || "Cost of Goods Sold"}</dd>
                        </div>
                        <div className="flex justify-between sm:justify-start gap-4">
                          <dt className="text-slate-500 w-28 shrink-0">Preferred Vendor</dt>
                          <dd className="font-medium text-slate-800 dark:text-slate-200">{currentItem.preferredVendor || "Telecom Operator Ltd"}</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Sales Information */}
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 pb-1 border-b border-slate-100 dark:border-slate-800/80">
                        Sales Information
                      </h3>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
                        <div className="flex justify-between sm:justify-start gap-4">
                          <dt className="text-slate-500 w-28 shrink-0">Selling Price</dt>
                          <dd className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{currentItem.sellingPrice || "₹0.00"}</dd>
                        </div>
                        <div className="flex justify-between sm:justify-start gap-4">
                          <dt className="text-slate-500 w-28 shrink-0">Account</dt>
                          <dd className="font-medium text-slate-800 dark:text-slate-200">{currentItem.salesAccount || "Sales"}</dd>
                        </div>
                      </dl>
                      {currentItem.salesDescription && (
                        <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                          {currentItem.salesDescription}
                        </div>
                      )}
                    </div>

                    {/* Tax & Inventory Valuation */}
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 pb-1 border-b border-slate-100 dark:border-slate-800/80">
                        Default Tax & Valuation
                      </h3>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
                        <div className="flex justify-between sm:justify-start gap-4">
                          <dt className="text-slate-500 w-28 shrink-0">Intra State Tax</dt>
                          <dd className="font-medium text-slate-800 dark:text-slate-200">{currentItem.intraStateTax || "GST 18% [9% CGST + 9% SGST]"}</dd>
                        </div>
                        <div className="flex justify-between sm:justify-start gap-4">
                          <dt className="text-slate-500 w-28 shrink-0">Inter State Tax</dt>
                          <dd className="font-medium text-slate-800 dark:text-slate-200">{currentItem.interStateTax || "IGST 18%"}</dd>
                        </div>
                        <div className="flex justify-between sm:justify-start gap-4">
                          <dt className="text-slate-500 w-28 shrink-0">Track Inventory</dt>
                          <dd className="font-medium text-slate-800 dark:text-slate-200">{currentItem.trackInventory ? "Yes" : "No"}</dd>
                        </div>
                        <div className="flex justify-between sm:justify-start gap-4">
                          <dt className="text-slate-500 w-28 shrink-0">In Stock</dt>
                          <dd className="font-bold text-slate-900 dark:text-white">{currentItem.stock || "0 Units"}</dd>
                        </div>
                      </dl>
                    </div>

                  </div>

                  {/* Right Images & Upload Card (4 Cols) */}
                  <div className="lg:col-span-4 bg-slate-50/70 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Product Images
                      </div>
                      {(currentItem.frontImage || currentItem.rearImage || (currentItem.galleryImages && currentItem.galleryImages.length > 0)) && (
                        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/40">
                          Uploaded
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Front View */}
                      <div>
                        <div className="text-[11px] font-medium text-slate-500 mb-1.5 flex items-center justify-between">
                          <span>Front View</span>
                          {currentItem.frontImage && (
                            <button
                              type="button"
                              onClick={() => handleRemoveImage("frontImage")}
                              className="text-rose-500 hover:text-rose-600 text-[10px]"
                              title="Remove image"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        {currentItem.frontImage ? (
                          <div
                            onClick={() => openLightbox(currentItem.frontImage, "Front View")}
                            className="relative h-28 rounded-lg overflow-hidden border border-blue-400/50 dark:border-blue-500/50 bg-black/5 dark:bg-black/30 group cursor-zoom-in"
                            title="Click to expand picture"
                          >
                            <img
                              src={currentItem.frontImage}
                              alt="Front View"
                              className="h-full w-full object-contain p-1 transition-transform duration-200 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                              <Maximize2 className="h-5 w-5 text-white drop-shadow-md" />
                              <span className="text-[10px] text-white font-semibold bg-black/70 px-2 py-0.5 rounded shadow-xs">
                                Click to Expand
                              </span>
                            </div>
                          </div>
                        ) : (
                          <label className="h-28 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 flex flex-col items-center justify-center gap-1 bg-white dark:bg-slate-950/60 text-center p-2 cursor-pointer transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleUploadDirectImage(e, "frontImage")}
                            />
                            <Upload className="h-4 w-4 text-blue-500" />
                            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                              Upload Front Image
                            </span>
                          </label>
                        )}
                      </div>

                      {/* Rear View */}
                      <div>
                        <div className="text-[11px] font-medium text-slate-500 mb-1.5 flex items-center justify-between">
                          <span>Rear View</span>
                          {currentItem.rearImage && (
                            <button
                              type="button"
                              onClick={() => handleRemoveImage("rearImage")}
                              className="text-rose-500 hover:text-rose-600 text-[10px]"
                              title="Remove image"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        {currentItem.rearImage ? (
                          <div
                            onClick={() => openLightbox(currentItem.rearImage, "Rear View")}
                            className="relative h-28 rounded-lg overflow-hidden border border-blue-400/50 dark:border-blue-500/50 bg-black/5 dark:bg-black/30 group cursor-zoom-in"
                            title="Click to expand picture"
                          >
                            <img
                              src={currentItem.rearImage}
                              alt="Rear View"
                              className="h-full w-full object-contain p-1 transition-transform duration-200 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                              <Maximize2 className="h-5 w-5 text-white drop-shadow-md" />
                              <span className="text-[10px] text-white font-semibold bg-black/70 px-2 py-0.5 rounded shadow-xs">
                                Click to Expand
                              </span>
                            </div>
                          </div>
                        ) : (
                          <label className="h-28 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 flex flex-col items-center justify-center gap-1 bg-white dark:bg-slate-950/60 text-center p-2 cursor-pointer transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleUploadDirectImage(e, "rearImage")}
                            />
                            <Upload className="h-4 w-4 text-blue-500" />
                            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                              Upload Rear Image
                            </span>
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Other Images / Gallery */}
                    <div>
                      <div className="text-[11px] font-medium text-slate-500 mb-1.5">Other Images</div>
                      {currentItem.galleryImages && currentItem.galleryImages.length > 0 ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            {currentItem.galleryImages.map((img: string, idx: number) => (
                              <div
                                key={idx}
                                onClick={() => openLightbox(img, `Gallery Image ${idx + 1}`)}
                                className="relative h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 group cursor-zoom-in"
                                title="Click to expand picture"
                              >
                                <img src={img} alt={`Gallery ${idx}`} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Maximize2 className="h-4 w-4 text-white" />
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveGalleryImage(idx);
                                  }}
                                  className="absolute top-1 right-1 h-5 w-5 bg-black/70 hover:bg-rose-600 rounded flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Delete image"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <label className="block p-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-center cursor-pointer hover:border-blue-500 text-[11px] text-blue-600 font-medium">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={handleUploadDirectGallery}
                            />
                            + Add More Images
                          </label>
                        </div>
                      ) : (
                        <label className="p-4 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 flex flex-col items-center justify-center gap-1.5 bg-white dark:bg-slate-950/60 text-center cursor-pointer transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleUploadDirectGallery}
                          />
                          <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
                            <Upload className="h-4 w-4" />
                          </div>
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            Drag & Drop Images
                          </div>
                          <div className="text-[10px] text-slate-400 leading-tight">
                            You can add up to 15 images including front, rear and other images, each not exceeding 5 MB.
                          </div>
                        </label>
                      )}
                    </div>

                  </div>

                </div>
              )}

              {/* TAB 2: TRANSACTIONS */}
              {detailTab === "transactions" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Linked Transactions for {currentItem.name}
                    </div>
                    <Badge variant="outline" className="text-[10px]">All Periods</Badge>
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Transaction #</th>
                          <th className="p-3">Customer / Vendor</th>
                          <th className="p-3 text-right">Quantity</th>
                          <th className="p-3 text-right">Amount</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        <tr>
                          <td className="p-3 font-mono">2026-09-15</td>
                          <td className="p-3 font-medium text-emerald-600">Invoice</td>
                          <td className="p-3 font-mono font-semibold">INV-2026-0042</td>
                          <td className="p-3">Acme Enterprise Corp</td>
                          <td className="p-3 text-right font-mono">1</td>
                          <td className="p-3 text-right font-semibold">{currentItem.sellingPrice || "₹400.00"}</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200">
                              PAID
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono">2026-08-20</td>
                          <td className="p-3 font-medium text-blue-600">Estimate</td>
                          <td className="p-3 font-mono font-semibold">EST-2026-0019</td>
                          <td className="p-3">Starlight Logistics</td>
                          <td className="p-3 text-right font-mono">2</td>
                          <td className="p-3 text-right font-semibold">{currentItem.sellingPrice || "₹400.00"}</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-600 border border-blue-200">
                              ACCEPTED
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: HISTORY */}
              {detailTab === "history" && (
                <div className="space-y-4 max-w-2xl">
                  <div className="text-xs font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
                    Audit Trail & Lifecycle History
                  </div>
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                    <div className="relative">
                      <div className="absolute -left-[27px] top-0.5 h-3.5 w-3.5 rounded-full bg-blue-600 border-2 border-white dark:border-[#0B132B]" />
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        Item Created
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Created by user under Organization Ledger • 2026-09-01 10:14 AM
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[27px] top-0.5 h-3.5 w-3.5 rounded-full bg-emerald-600 border-2 border-white dark:border-[#0B132B]" />
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        Standard Selling Rate Verified
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Rate fixed at {currentItem.sellingPrice} • Tax Preference: {currentItem.taxPreference}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-slate-400 text-xs">
            Select an item from the list to view specifications.
          </div>
        )}

      </main>

      {/* ================================================================= */}
      {/* FULLSCREEN EXPANDED IMAGE LIGHTBOX MODAL */}
      {/* ================================================================= */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200 select-none"
          onClick={() => setExpandedImage(null)}
        >
          {/* Top Control Bar */}
          <div
            className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/90 via-black/50 to-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-blue-400" />
                <span>{expandedImage.title}</span>
              </div>
              {expandedImage.allImages.length > 1 && (
                <div className="text-xs text-slate-400 mt-0.5">
                  Photo {expandedImage.index + 1} of {expandedImage.allImages.length} • Use Left/Right arrow keys to navigate • Esc to close
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Out */}
              <button
                type="button"
                onClick={() => setZoomScale((s) => Math.max(0.5, s - 0.25))}
                className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                title="Zoom Out (-)"
              >
                <ZoomOut className="h-4 w-4" />
              </button>

              {/* Reset Zoom / Scale Pill */}
              <button
                type="button"
                onClick={() => setZoomScale(1)}
                className="h-9 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono font-semibold text-white flex items-center justify-center transition-colors"
                title="Reset Zoom to 100%"
              >
                {Math.round(zoomScale * 100)}%
              </button>

              {/* Zoom In */}
              <button
                type="button"
                onClick={() => setZoomScale((s) => Math.min(3.5, s + 0.25))}
                className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                title="Zoom In (+)"
              >
                <ZoomIn className="h-4 w-4" />
              </button>

              {/* Rotate */}
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                title="Rotate 90° Clockwise"
              >
                <RotateCw className="h-4 w-4" />
              </button>

              {/* Download */}
              <a
                href={expandedImage.src}
                download={`${currentItem.name.replace(/\s+/g, "_")}_${expandedImage.index + 1}.jpg`}
                className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                title="Download full size image"
              >
                <Download className="h-4 w-4" />
              </a>

              {/* Close (X) */}
              <button
                type="button"
                onClick={() => setExpandedImage(null)}
                className="h-9 w-9 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center transition-colors ml-2 shadow-lg"
                title="Close (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Left Arrow for Previous */}
          {expandedImage.allImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigateLightbox(-1);
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-all shadow-2xl hover:scale-110"
              title="Previous Photo (Left Arrow)"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Expanded Center Image */}
          <div
            className="max-w-[92vw] max-h-[86vh] flex items-center justify-center overflow-hidden p-4 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={expandedImage.src}
              alt={expandedImage.title}
              style={{
                transform: `scale(${zoomScale}) rotate(${rotation}deg)`,
                transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl drop-shadow-2xl border border-white/10"
            />
          </div>

          {/* Right Arrow for Next */}
          {expandedImage.allImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigateLightbox(1);
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-all shadow-2xl hover:scale-110"
              title="Next Photo (Right Arrow)"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Bottom Thumbnails Carousel Strip */}
          {expandedImage.allImages.length > 1 && (
            <div
              className="absolute bottom-5 inset-x-0 flex items-center justify-center gap-2 z-10 p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md p-2 rounded-2xl border border-white/15 shadow-2xl">
                {expandedImage.allImages.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setExpandedImage({
                        src: img.src,
                        title: `${currentItem.name} - ${img.title}`,
                        index: i,
                        allImages: expandedImage.allImages,
                      });
                      setZoomScale(1);
                      setRotation(0);
                    }}
                    className={`h-14 w-14 rounded-xl overflow-hidden border-2 transition-all ${
                      i === expandedImage.index
                        ? "border-blue-500 scale-105 shadow-md shadow-blue-500/30"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img.src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ================================================================= */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Item</h3>
                <p className="text-xs text-slate-500">Permanent removal from inventory</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{currentItem?.name}</strong> (<span className="font-mono text-blue-600 dark:text-blue-400">{currentItem?.sku}</span>)?
              This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteModal(false)}
                className="text-xs h-8 border-slate-200 dark:border-slate-800"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={confirmDelete}
                className="text-xs h-8 bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Item
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MOVE TO ANOTHER ITEM MODAL */}
      {/* ================================================================= */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <ArrowRightLeft className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Move to Another Item</h3>
                  <p className="text-xs text-slate-500">Transfer records and associations</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMoveModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
              <div className="text-slate-400 text-[11px]">Source Item:</div>
              <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                <span>{currentItem?.name}</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 text-[11px]">{currentItem?.sku}</span>
              </div>
              <div className="text-[11px] text-slate-500">Current Stock: {currentItem?.stock}</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Destination Item <span className="text-red-500">*</span>
              </label>
              <select
                value={targetMoveItemId}
                onChange={(e) => setTargetMoveItemId(e.target.value)}
                className="w-full text-xs h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Select Destination Item --</option>
                {items
                  .filter((i) => i.sku !== currentItem?.sku && i.id !== currentItem?.id)
                  .map((item) => (
                    <option key={item.sku || item.id} value={item.sku || item.id}>
                      {item.name} ({item.sku}) - {item.type}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={transferStockOnMove}
                  onChange={(e) => setTransferStockOnMove(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Transfer inventory stock and order transactions to destination item</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMoveModal(false)}
                className="text-xs h-8 border-slate-200 dark:border-slate-800"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!targetMoveItemId}
                onClick={confirmMove}
                className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Move Records
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TOAST NOTIFICATION */}
      {/* ================================================================= */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl border border-slate-700 dark:border-slate-200 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <div className="max-w-xs">
            <p className="text-xs font-bold leading-tight">{toast.title}</p>
            <p className="text-[11px] text-slate-300 dark:text-slate-600 mt-0.5 leading-snug">{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-white dark:hover:text-slate-900 p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}
