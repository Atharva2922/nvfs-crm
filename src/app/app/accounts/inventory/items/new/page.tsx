"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  X,
  Plus,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Search,
  Package,
  Layers,
  ArrowLeft,
  Trash2,
  Sparkles,
  Info,
  DollarSign,
  Barcode,
  Truck,
  RotateCcw,
  Boxes,
  Building2,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { initialZohoItems } from "@/modules/accounts/constants/inventory-defaults";

function InventoryItemFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editParam = searchParams.get("edit");
  const isEditMode = !!editParam;

  // Basic Information
  const [name, setName] = useState("");
  const [type, setType] = useState<"Goods" | "Service">("Goods");
  const [brand, setBrand] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [isAddingBrand, setIsAddingBrand] = useState(false);
  const [manufacturer, setManufacturer] = useState("");
  const [customManufacturer, setCustomManufacturer] = useState("");
  const [isAddingManufacturer, setIsAddingManufacturer] = useState(false);
  const [hsnCode, setHsnCode] = useState("");
  const [taxPreference, setTaxPreference] = useState("Taxable");

  // Images state
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [rearImage, setRearImage] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const rearInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Item Details
  const [itemType, setItemType] = useState<"Single Item" | "Contains Variants">("Single Item");
  const [unit, setUnit] = useState("units");
  const [sku, setSku] = useState("");
  const [identifiers, setIdentifiers] = useState<Array<{ type: string; value: string }>>([]);

  // Description
  const [description, setDescription] = useState("");

  // Sales Information
  const [enableSales, setEnableSales] = useState(true);
  const [sellingPrice, setSellingPrice] = useState("");
  const [salesAccount, setSalesAccount] = useState("Sales");
  const [salesDescription, setSalesDescription] = useState("");

  // Purchase Information
  const [enablePurchase, setEnablePurchase] = useState(true);
  const [costPrice, setCostPrice] = useState("");
  const [purchaseAccount, setPurchaseAccount] = useState("Cost of Goods Sold");
  const [purchaseDescription, setPurchaseDescription] = useState("");
  const [preferredVendor, setPreferredVendor] = useState("");

  // Tax Rates
  const [intraStateTax, setIntraStateTax] = useState("GST 18% [9% CGST + 9% SGST]");
  const [interStateTax, setInterStateTax] = useState("IGST 18%");

  // Inventory Tracking
  const [trackInventory, setTrackInventory] = useState(true);
  const [binLocationTracking, setBinLocationTracking] = useState<"Yes" | "No">("No");
  const [inventoryTracking, setInventoryTracking] = useState<"None" | "Serial" | "Batch">("None");
  const [inventoryAccount, setInventoryAccount] = useState("Inventory Asset");
  const [valuationMethod, setValuationMethod] = useState("FIFO (First In, First Out)");
  const [reorderPoint, setReorderPoint] = useState("10");
  const [openingStock, setOpeningStock] = useState("0");
  const [initialWarehouse, setInitialWarehouse] = useState("Main Central Warehouse");

  // Cancellation & Returns
  const [returnable, setReturnable] = useState<"Yes" | "No">("Yes");

  // Fulfilment Details
  const [dimLength, setDimLength] = useState("");
  const [dimWidth, setDimWidth] = useState("");
  const [dimHeight, setDimHeight] = useState("");
  const [dimUnit, setDimUnit] = useState("cm");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");

  // Variants state (if "Contains Variants" is active)
  const [variants, setVariants] = useState<Array<{ name: string; options: string }>>([
    { name: "Color", options: "Black, Silver, Space Gray" },
  ]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: "success" | "error" } | null>(null);

  // Helper to prefill form with existing item
  const populateForm = (data: any) => {
    if (!data) return;
    if (data.name) setName(data.name);
    if (data.type) {
      setType(data.type === "Service" ? "Service" : "Goods");
    } else if (data.productType) {
      setType(data.productType === "PHYSICAL" ? "Goods" : "Service");
    }
    if (data.brand) setBrand(data.brand);
    if (data.manufacturer) setManufacturer(data.manufacturer);
    if (data.hsnCode) setHsnCode(data.hsnCode);
    if (data.taxPreference) setTaxPreference(data.taxPreference);
    if (data.frontImage || data.imageUrl) setFrontImage(data.frontImage || data.imageUrl);
    if (data.rearImage) setRearImage(data.rearImage);
    if (Array.isArray(data.galleryImages)) setGalleryImages(data.galleryImages);
    if (data.itemType) setItemType(data.itemType);
    if (data.unit) setUnit(data.unit);
    else if (data.unitOfMeasure) setUnit(data.unitOfMeasure.toLowerCase());
    if (data.sku) setSku(data.sku);
    if (data.description) setDescription(data.description);

    if (data.sellingPrice != null) {
      setSellingPrice(String(data.sellingPrice).replace(/[^0-9.-]+/g, ""));
    }
    if (data.salesAccount) setSalesAccount(data.salesAccount);
    if (data.salesDescription) setSalesDescription(data.salesDescription);

    if (data.costPrice != null || data.purchasePrice != null) {
      setCostPrice(String(data.costPrice ?? data.purchasePrice).replace(/[^0-9.-]+/g, ""));
    }
    if (data.purchaseAccount) setPurchaseAccount(data.purchaseAccount);
    if (data.purchaseDescription) setPurchaseDescription(data.purchaseDescription);
    if (data.preferredVendor) setPreferredVendor(data.preferredVendor);

    if (data.intraStateTax) setIntraStateTax(data.intraStateTax);
    if (data.interStateTax) setInterStateTax(data.interStateTax);

    if (data.trackInventory !== undefined) setTrackInventory(!!data.trackInventory);
    if (data.binLocationTracking) setBinLocationTracking(data.binLocationTracking);
    if (data.inventoryTracking) setInventoryTracking(data.inventoryTracking);
    if (data.inventoryAccount) setInventoryAccount(data.inventoryAccount);
    if (data.valuationMethod) setValuationMethod(data.valuationMethod);
    if (data.reorderPoint != null || data.reorderLevel != null) {
      setReorderPoint(String(data.reorderPoint ?? data.reorderLevel));
    }
    if (data.stock) {
      setOpeningStock(String(data.stock).replace(/[^0-9.-]+/g, "") || "0");
    }
    if (data.returnable) setReturnable(data.returnable);

    // Parse dimensions if formatted e.g. "48 x 43 x 4 cm"
    if (data.dimensions) {
      const parts = String(data.dimensions).split("x").map((s) => s.trim());
      if (parts[0]) setDimLength(parts[0]);
      if (parts[1]) setDimWidth(parts[1]);
      if (parts[2]) {
        const hParts = parts[2].split(" ");
        setDimHeight(hParts[0] || "");
        if (hParts[1]) setDimUnit(hParts[1]);
      }
    }
    if (data.weight) {
      const wParts = String(data.weight).split(" ");
      if (wParts[0]) setWeight(wParts[0]);
      if (wParts[1]) setWeightUnit(wParts[1]);
    }
  };

  // Prefill when in edit mode
  useEffect(() => {
    if (!editParam) return;

    // 1. Search localStorage
    try {
      const stored = localStorage.getItem("nfvs_inventory_items");
      if (stored) {
        const parsed = JSON.parse(stored);
        const match = parsed.find(
          (p: any) =>
            String(p.sku || "").toLowerCase() === editParam.toLowerCase() ||
            String(p.id || "").toLowerCase() === editParam.toLowerCase()
        );
        if (match) {
          populateForm(match);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }

    // Check if item was deleted
    try {
      const ds = localStorage.getItem("nfvs_deleted_inventory_items");
      if (ds) {
        const deletedSet = new Set(JSON.parse(ds).map((s: string) => String(s).toLowerCase().trim()));
        if (deletedSet.has(editParam.toLowerCase().trim())) {
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Search initialZohoItems
    const sampleMatch = initialZohoItems.find(
      (p: any) =>
        String(p.sku || "").toLowerCase() === editParam.toLowerCase() ||
        String(p.id || "").toLowerCase() === editParam.toLowerCase()
    );
    if (sampleMatch) {
      populateForm(sampleMatch);
      return;
    }

    // 3. Fetch from backend products API
    fetch(`/api/inventory/products/${encodeURIComponent(editParam)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          populateForm(data.data);
        }
      })
      .catch((err) => console.warn(err));
  }, [editParam]);

  // Auto-generate SKU
  const handleAutoGenerateSKU = () => {
    const prefix = type === "Goods" ? "SKU" : "SRV";
    const brandPart = (brand || "GEN").slice(0, 3).toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setSku(`${prefix}-${brandPart}-${randomSuffix}`);
  };

  // Canvas Image Compression helper to prevent localStorage quota issues
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

  // Image Upload Handlers
  const handleImageFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setter(compressed);
      } catch {
        const reader = new FileReader();
        reader.onload = (event) => setter(event.target?.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleGalleryFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    for (const file of files) {
      try {
        const compressed = await compressImage(file);
        setGalleryImages((prev) => [...prev, compressed].slice(0, 15));
      } catch {
        const reader = new FileReader();
        reader.onload = (event) => {
          setGalleryImages((prev) => [...prev, event.target?.result as string].slice(0, 15));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Identifiers Handlers
  const addIdentifier = () => {
    setIdentifiers((prev) => [...prev, { type: "Barcode", value: "" }]);
  };

  const removeIdentifier = (index: number) => {
    setIdentifiers((prev) => prev.filter((_, i) => i !== index));
  };

  const updateIdentifier = (index: number, field: "type" | "value", val: string) => {
    setIdentifiers((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  };

  // Save Item Handler
  const handleSave = async (saveAndNew = false) => {
    setFormError(null);

    // Validation
    if (!name.trim()) {
      setFormError("Item Name is required.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!sku.trim()) {
      setFormError("SKU is required. You can click 'Auto-Generate' or enter one.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (enableSales && !sellingPrice) {
      setFormError("Selling Price is required when Sales Information is enabled.");
      return;
    }

    setIsSubmitting(true);

    const updatedSku = sku.trim().toUpperCase();

    const newItemData = {
      id: updatedSku,
      sku: updatedSku,
      name: name.trim(),
      type,
      itemTypeString: `Sales and Purchase Items (${type})`,
      brand: isAddingBrand ? customBrand : brand || "Unbranded",
      manufacturer: isAddingManufacturer ? customManufacturer : manufacturer || "Generic",
      hsnCode: hsnCode.trim(),
      taxPreference,
      itemType,
      unit,
      description: description.trim(),
      group: brand || (type === "Goods" ? "Hardware & Equipment" : "Professional Services"),
      stock: trackInventory ? `${openingStock || "0"} ${unit}` : "Non-tracked",
      costPrice: costPrice ? `₹${Number(costPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "₹0.00",
      sellingPrice: sellingPrice ? `₹${Number(sellingPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "₹0.00",
      purchasePrice: costPrice ? `₹${Number(costPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "₹0.00",
      status: "ACTIVE",
      salesAccount,
      salesDescription,
      purchaseAccount,
      purchaseDescription,
      preferredVendor,
      intraStateTax,
      interStateTax,
      trackInventory,
      binLocationTracking,
      inventoryTracking,
      inventoryAccount,
      valuationMethod,
      reorderPoint: Number(reorderPoint) || 0,
      returnable,
      dimensions: dimLength ? `${dimLength} x ${dimWidth || 0} x ${dimHeight || 0} ${dimUnit}` : undefined,
      weight: weight ? `${weight} ${weightUnit}` : undefined,
      frontImage: frontImage || null,
      rearImage: rearImage || null,
      galleryImages: galleryImages || [],
      galleryImagesCount: galleryImages.length,
      imageUrl: frontImage || null,
      createdSource: isEditMode ? "User Edited" : "User",
      updatedAt: new Date().toISOString(),
    };

    try {
      // 1. Save or Update in local storage
      const stored = localStorage.getItem("nfvs_inventory_items");
      const currentItems = stored ? JSON.parse(stored) : [];

      let updatedList: any[];
      if (isEditMode && editParam) {
        const exists = currentItems.some(
          (p: any) =>
            String(p.sku || "").toLowerCase() === editParam.toLowerCase() ||
            String(p.id || "").toLowerCase() === editParam.toLowerCase()
        );
        if (exists) {
          updatedList = currentItems.map((item: any) => {
            if (
              String(item.sku || "").toLowerCase() === editParam.toLowerCase() ||
              String(item.id || "").toLowerCase() === editParam.toLowerCase()
            ) {
              return { ...item, ...newItemData };
            }
            return item;
          });
        } else {
          updatedList = [newItemData, ...currentItems];
        }
      } else {
        updatedList = [newItemData, ...currentItems.filter((i: any) => i.sku !== updatedSku)];
      }

      localStorage.setItem("nfvs_inventory_items", JSON.stringify(updatedList));

      // Remove from deleted list if previously marked deleted
      try {
        const ds = localStorage.getItem("nfvs_deleted_inventory_items");
        if (ds) {
          const arr: string[] = JSON.parse(ds);
          const filtered = arr.filter((s) => s.toLowerCase().trim() !== updatedSku.toLowerCase().trim());
          localStorage.setItem("nfvs_deleted_inventory_items", JSON.stringify(filtered));
        }
      } catch {}
      try {
        if (isEditMode && editParam) {
          await fetch(`/api/inventory/products/${encodeURIComponent(editParam)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: newItemData.name,
              description: newItemData.description,
              imageUrl: frontImage || undefined,
              productType: type === "Goods" ? "PHYSICAL" : "OTHER",
              unitOfMeasure: unit.toUpperCase(),
              sellingPrice: Number(sellingPrice) || 0,
              costPrice: Number(costPrice) || 0,
              taxRate: 18,
              status: "ACTIVE",
              reorderLevel: Number(reorderPoint) || 10,
            }),
          });
        } else {
          await fetch("/api/inventory/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sku: newItemData.sku,
              name: newItemData.name,
              description: newItemData.description,
              imageUrl: frontImage || undefined,
              productType: type === "Goods" ? "PHYSICAL" : "OTHER",
              unitOfMeasure: unit.toUpperCase(),
              sellingPrice: Number(sellingPrice) || 0,
              costPrice: Number(costPrice) || 0,
              taxRate: 18,
              status: "ACTIVE",
              reorderLevel: Number(reorderPoint) || 10,
            }),
          });
        }
      } catch (apiErr) {
        console.warn("Backend API sync skipped or in offline mode, local state synced:", apiErr);
      }

      setToastMessage({
        title: isEditMode ? "Item Updated Successfully" : "Item Created Successfully",
        desc: `${newItemData.name} (${newItemData.sku}) has been saved.`,
        type: "success",
      });

      if (saveAndNew && !isEditMode) {
        // Reset form for next item
        setName("");
        setSku("");
        setDescription("");
        setSellingPrice("");
        setCostPrice("");
        setOpeningStock("0");
        setFrontImage(null);
        setRearImage(null);
        setGalleryImages([]);
        setIdentifiers([]);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setTimeout(() => {
          router.push("/app/accounts/inventory/items");
        }, 700);
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to save item. Please review fields.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B132B] text-slate-900 dark:text-slate-100 pb-28">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2 border border-emerald-500">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <div>
            <div className="text-sm font-semibold">{toastMessage.title}</div>
            <div className="text-xs text-emerald-100">{toastMessage.desc}</div>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 hover:bg-emerald-700 p-1 rounded-md transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Professional Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 transition-all">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/app/accounts/inventory/items"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Return to Items"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Link href="/app/accounts" className="hover:text-blue-500 transition-colors">Accounts</Link>
                <span>/</span>
                <Link href="/app/accounts/inventory/items" className="hover:text-blue-500 transition-colors">Inventory</Link>
                <span>/</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {isEditMode ? "Edit Item" : "New Item"}
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                {isEditMode ? `Edit: ${name || sku}` : "New Item"}
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  {isEditMode ? "Editing Existing Record" : "Zoho Compatible Master"}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push("/app/accounts/inventory/items")}
              className="text-xs h-9 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            {!isEditMode && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={() => handleSave(true)}
                className="text-xs h-9 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Save & New
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              disabled={isSubmitting}
              onClick={() => handleSave(false)}
              className="text-xs h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm gap-1.5 px-5"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {isEditMode ? "Save Changes" : "Save"}
                </>
              )}
            </Button>
            <Link
              href="/app/accounts/inventory/items"
              className="h-8 w-8 ml-1 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close without saving"
            >
              <X className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Form Error Banner */}
      {formError && (
        <div className="max-w-[1500px] mx-auto px-6 mt-4">
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        </div>
      )}

      {/* Main Form Body */}
      <main className="max-w-[1500px] mx-auto px-6 py-6 space-y-8">
        
        {/* SECTION 1: Core Identification & Images (2-Column Grid) */}
        <section className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Inputs (7 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Name<span className="text-rose-500 ml-0.5">*</span>
                </label>
                <div className="sm:col-span-2">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Cisco 24-Port Gigabit Managed Switch"
                    className="h-10 text-sm bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Type</span>
                  <div className="group relative cursor-pointer" title="Goods are physical items with inventory; Services are billable hours or labor">
                    <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>
                <div className="sm:col-span-2 flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <input
                      type="radio"
                      name="itemTypeOption"
                      checked={type === "Goods"}
                      onChange={() => {
                        setType("Goods");
                        setTrackInventory(true);
                      }}
                      className="h-4 w-4 text-blue-600 border-slate-300 dark:border-slate-700 focus:ring-blue-500"
                    />
                    <span className="text-slate-800 dark:text-slate-200">Goods</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <input
                      type="radio"
                      name="itemTypeOption"
                      checked={type === "Service"}
                      onChange={() => {
                        setType("Service");
                        setTrackInventory(false);
                      }}
                      className="h-4 w-4 text-blue-600 border-slate-300 dark:border-slate-700 focus:ring-blue-500"
                    />
                    <span className="text-slate-800 dark:text-slate-200">Service</span>
                  </label>
                </div>
              </div>

              {/* Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Brand
                </label>
                <div className="sm:col-span-2">
                  {!isAddingBrand ? (
                    <div className="flex gap-2">
                      <select
                        value={brand}
                        onChange={(e) => {
                          if (e.target.value === "__add_new__") {
                            setIsAddingBrand(true);
                          } else {
                            setBrand(e.target.value);
                          }
                        }}
                        className="flex-1 h-10 px-3 text-sm rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="">Select or Add Brand</option>
                        <option value="Dell">Dell Technologies</option>
                        <option value="Cisco">Cisco Systems</option>
                        <option value="APC">APC Schneider</option>
                        <option value="Samsung">Samsung</option>
                        <option value="Apple">Apple</option>
                        <option value="HP">HP Enterprise</option>
                        <option value="Lenovo">Lenovo ThinkSystem</option>
                        <option value="Ubiquiti">Ubiquiti Networks</option>
                        <option value="Intel">Intel Corporation</option>
                        {brand && !["Dell", "Cisco", "APC", "Samsung", "Apple", "HP", "Lenovo", "Ubiquiti", "Intel"].includes(brand) && (
                          <option value={brand}>{brand}</option>
                        )}
                        <option value="__add_new__">+ Add New Brand...</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={customBrand}
                        onChange={(e) => setCustomBrand(e.target.value)}
                        placeholder="Type new brand name"
                        className="h-10 text-sm bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsAddingBrand(false)}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Manufacturer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Manufacturer
                </label>
                <div className="sm:col-span-2">
                  {!isAddingManufacturer ? (
                    <select
                      value={manufacturer}
                      onChange={(e) => {
                        if (e.target.value === "__add_new__") {
                          setIsAddingManufacturer(true);
                        } else {
                          setManufacturer(e.target.value);
                        }
                      }}
                      className="w-full h-10 px-3 text-sm rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="">Select or Add Manufacturer</option>
                      <option value="Dell India Ltd">Dell India Ltd</option>
                      <option value="Cisco Solutions Corp">Cisco Solutions Corp</option>
                      <option value="Schneider Electric SE">Schneider Electric SE</option>
                      <option value="Samsung Electronics">Samsung Electronics</option>
                      <option value="Western Digital">Western Digital Corp</option>
                      {manufacturer && !["Dell India Ltd", "Cisco Solutions Corp", "Schneider Electric SE", "Samsung Electronics", "Western Digital"].includes(manufacturer) && (
                        <option value={manufacturer}>{manufacturer}</option>
                      )}
                      <option value="__add_new__">+ Add New Manufacturer...</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={customManufacturer}
                        onChange={(e) => setCustomManufacturer(e.target.value)}
                        placeholder="Type new manufacturer name"
                        className="h-10 text-sm bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsAddingManufacturer(false)}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* HSN Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  HSN / SAC Code
                </label>
                <div className="sm:col-span-2 relative">
                  <Input
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    placeholder="Type to add or search (e.g. 84715000)"
                    className="h-10 text-sm pr-9 bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Tax Preference */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tax Preference<span className="text-rose-500 ml-0.5">*</span>
                </label>
                <div className="sm:col-span-2">
                  <select
                    value={taxPreference}
                    onChange={(e) => setTaxPreference(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Taxable">Taxable</option>
                    <option value="Non-Taxable">Non-Taxable</option>
                    <option value="Out of Scope">Out of Scope</option>
                    <option value="Non-GST Supply">Non-GST Supply</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Right Images Panel (5 Cols) */}
            <div className="lg:col-span-5 bg-slate-50/80 dark:bg-slate-950/50 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Item Images
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Front View */}
                <div>
                  <div className="text-[11px] font-medium text-slate-500 mb-1.5">Front View</div>
                  <input
                    ref={frontInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageFile(e, setFrontImage)}
                  />
                  {frontImage ? (
                    <div className="relative h-28 rounded-lg overflow-hidden border border-blue-500/40 bg-black/10 group">
                      <img src={frontImage} alt="Front View" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFrontImage(null)}
                        className="absolute top-1 right-1 h-6 w-6 bg-rose-600 text-white rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => frontInputRef.current?.click()}
                      className="h-28 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-white dark:bg-slate-900/60 transition-colors"
                    >
                      <Upload className="h-4 w-4 text-blue-500" />
                      <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                        Upload Front Image
                      </span>
                    </div>
                  )}
                </div>

                {/* Rear View */}
                <div>
                  <div className="text-[11px] font-medium text-slate-500 mb-1.5">Rear View</div>
                  <input
                    ref={rearInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageFile(e, setRearImage)}
                  />
                  {rearImage ? (
                    <div className="relative h-28 rounded-lg overflow-hidden border border-blue-500/40 bg-black/10 group">
                      <img src={rearImage} alt="Rear View" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setRearImage(null)}
                        className="absolute top-1 right-1 h-6 w-6 bg-rose-600 text-white rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => rearInputRef.current?.click()}
                      className="h-28 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-white dark:bg-slate-900/60 transition-colors"
                    >
                      <Upload className="h-4 w-4 text-blue-500" />
                      <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                        Upload Rear Image
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Other Images Dropzone */}
              <div>
                <div className="text-[11px] font-medium text-slate-500 mb-1.5">Other Images</div>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleGalleryFiles}
                />
                <div
                  onClick={() => galleryInputRef.current?.click()}
                  className="p-4 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-white dark:bg-slate-900/60 text-center transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Drag & Drop Images
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    You can add up to 15 images including front, rear and other images, each not exceeding 5 MB.
                  </div>
                </div>

                {/* Gallery Previews */}
                {galleryImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {galleryImages.map((img, idx) => (
                      <div key={idx} className="relative h-12 w-12 rounded-md overflow-hidden border border-slate-300 dark:border-slate-700 group">
                        <img src={img} alt={`Gallery ${idx}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setGalleryImages((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </section>

        {/* SECTION 2: Item Details (Variants, Unit, SKU, Identifiers) */}
        <section className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>Item Details</span>
            <span className="text-xs font-normal text-slate-500">Inventory Classification</span>
          </div>

          {/* Item Type Pill Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Item Type
            </label>
            <div className="sm:col-span-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setItemType("Single Item")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                  itemType === "Single Item"
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:border-slate-300"
                }`}
              >
                <Package className="h-3.5 w-3.5" />
                Single Item
              </button>
              <button
                type="button"
                onClick={() => setItemType("Contains Variants")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                  itemType === "Contains Variants"
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:border-slate-300"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Contains Variants
              </button>
            </div>
          </div>

          {/* Variants configuration if active */}
          {itemType === "Contains Variants" && (
            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 space-y-3">
              <div className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                Item Variants (e.g. Color, Storage, Capacity)
              </div>
              {variants.map((v, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <Input
                    value={v.name}
                    onChange={(e) => {
                      const updated = [...variants];
                      updated[i].name = e.target.value;
                      setVariants(updated);
                    }}
                    placeholder="Attribute (e.g. Color)"
                    className="w-1/3 h-9 text-xs bg-white dark:bg-slate-900"
                  />
                  <Input
                    value={v.options}
                    onChange={(e) => {
                      const updated = [...variants];
                      updated[i].options = e.target.value;
                      setVariants(updated);
                    }}
                    placeholder="Options comma-separated (e.g. 1TB, 2TB, 4TB)"
                    className="flex-1 h-9 text-xs bg-white dark:bg-slate-900"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}
                    className="text-rose-500 h-9 px-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVariants([...variants, { name: "", options: "" }])}
                className="text-xs h-8 text-blue-600 border-blue-300 dark:border-blue-800"
              >
                <Plus className="h-3 w-3 mr-1" /> Add Attribute
              </Button>
            </div>
          )}

          {/* Unit & SKU Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Unit */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Unit</span>
                <span className="text-rose-500">*</span>
                <span title="Measuring unit for stock and sales">
                  <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                </span>
              </div>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="units">Units (unit)</option>
                <option value="pcs">Pieces (pcs)</option>
                <option value="box">Boxes (box)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="m">Meters (m)</option>
                <option value="set">Sets (set)</option>
                <option value="ltr">Litres (ltr)</option>
                <option value="hrs">Hours (hrs)</option>
                <option value="pk">Packs (pk)</option>
              </select>
            </div>

            {/* SKU */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>SKU</span>
                  <span className="text-rose-500">*</span>
                  <span title="Stock Keeping Unit unique code">
                    <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                  </span>
                </div>
                {!isEditMode && (
                  <button
                    type="button"
                    onClick={handleAutoGenerateSKU}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="h-3 w-3" /> Auto-generate
                  </button>
                )}
              </div>
              <Input
                value={sku}
                readOnly={isEditMode}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="e.g. SKU-SVR-01"
                className={`h-10 text-sm font-mono border-slate-200 dark:border-slate-800 ${
                  isEditMode ? "bg-slate-100 dark:bg-slate-800/80 cursor-not-allowed opacity-90" : "bg-white dark:bg-slate-950/70"
                }`}
              />
              {isEditMode && (
                <p className="text-[10px] text-slate-400">SKU cannot be changed once transactions exist.</p>
              )}
            </div>
          </div>

          {/* Dynamic Identifiers */}
          <div className="space-y-3 pt-2">
            {identifiers.map((ident, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <select
                  value={ident.type}
                  onChange={(e) => updateIdentifier(idx, "type", e.target.value)}
                  className="w-40 h-9 px-3 text-xs rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800"
                >
                  <option value="Barcode">Barcode</option>
                  <option value="UPC">UPC</option>
                  <option value="EAN">EAN</option>
                  <option value="ISBN">ISBN</option>
                  <option value="MPN">Part Number (MPN)</option>
                </select>
                <Input
                  value={ident.value}
                  onChange={(e) => updateIdentifier(idx, "value", e.target.value)}
                  placeholder={`Enter ${ident.type} code`}
                  className="flex-1 h-9 text-xs bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeIdentifier(idx)}
                  className="text-rose-500 h-9 px-2 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <button
              type="button"
              onClick={addIdentifier}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1.5 hover:underline py-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add Identifier
            </button>
          </div>

        </section>

        {/* SECTION 3: Item Description */}
        <section className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 sm:p-8 space-y-4">
          <div className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            Item Description
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 pt-2">
              Description
            </label>
            <div className="sm:col-span-3">
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter detailed technical specs, internal specifications, or warranty particulars..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </section>

        {/* SECTION 4: Sales & Purchase Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Sales Information Card */}
          <section className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSales}
                  onChange={(e) => setEnableSales(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded border-slate-300 dark:border-slate-700"
                />
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  Sales Information
                </span>
              </label>
              <Badge variant="outline" className="text-[10px] text-slate-500">Revenue</Badge>
            </div>

            {enableSales && (
              <div className="space-y-4 pt-1">
                {/* Selling Price */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Selling Price<span className="text-rose-500 ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                      INR (₹)
                    </span>
                    <Input
                      type="number"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      placeholder="0.00"
                      className="pl-16 h-10 text-sm font-semibold bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>

                {/* Account */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Account<span className="text-rose-500 ml-0.5">*</span>
                  </label>
                  <select
                    value={salesAccount}
                    onChange={(e) => setSalesAccount(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Sales">Sales</option>
                    <option value="General Sales">General Sales</option>
                    <option value="Product Sales Revenue">Product Sales Revenue</option>
                    <option value="Hardware Sales">Hardware Sales</option>
                    <option value="Discount">Discount</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={salesDescription}
                    onChange={(e) => setSalesDescription(e.target.value)}
                    placeholder="Description to show on customer invoices and quotations"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Purchase Information Card */}
          <section className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enablePurchase}
                  onChange={(e) => setEnablePurchase(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded border-slate-300 dark:border-slate-700"
                />
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  Purchase Information
                </span>
              </label>
              <Badge variant="outline" className="text-[10px] text-slate-500">Expenses / COGS</Badge>
            </div>

            {enablePurchase && (
              <div className="space-y-4 pt-1">
                {/* Cost Price */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Cost Price<span className="text-rose-500 ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                      INR (₹)
                    </span>
                    <Input
                      type="number"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      placeholder="0.00"
                      className="pl-16 h-10 text-sm font-semibold bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>

                {/* Account */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Account<span className="text-rose-500 ml-0.5">*</span>
                  </label>
                  <select
                    value={purchaseAccount}
                    onChange={(e) => setPurchaseAccount(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Cost of Goods Sold">Cost of Goods Sold</option>
                    <option value="Hardware Procurement">Hardware Procurement</option>
                    <option value="Operating Expense">Operating Expense</option>
                    <option value="Inventory Asset">Inventory Asset</option>
                  </select>
                </div>

                {/* Preferred Vendor */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Preferred Vendor
                  </label>
                  <select
                    value={preferredVendor}
                    onChange={(e) => setPreferredVendor(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">Select a Vendor</option>
                    <option value="TechDistributors India Pvt Ltd">TechDistributors India Pvt Ltd</option>
                    <option value="Global Hardware Solutions">Global Hardware Solutions</option>
                    <option value="Arrow Electronics Inc">Arrow Electronics Inc</option>
                    <option value="Ingram Micro India">Ingram Micro India</option>
                    <option value="Redington Ltd">Redington Ltd</option>
                  </select>
                </div>

                {/* Purchase Description */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={purchaseDescription}
                    onChange={(e) => setPurchaseDescription(e.target.value)}
                    placeholder="Description to show on vendor purchase orders"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            )}
          </section>

        </div>

        {/* SECTION 5: Default Tax Rates */}
        <section className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            Default Tax Rates
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Intra State Tax */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Intra State Tax Rate
              </label>
              <select
                value={intraStateTax}
                onChange={(e) => setIntraStateTax(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="GST 18% [9% CGST + 9% SGST]">GST 18% [9% CGST + 9% SGST]</option>
                <option value="GST 12% [6% CGST + 6% SGST]">GST 12% [6% CGST + 6% SGST]</option>
                <option value="GST 28% [14% CGST + 14% SGST]">GST 28% [14% CGST + 14% SGST]</option>
                <option value="GST 5% [2.5% CGST + 2.5% SGST]">GST 5% [2.5% CGST + 2.5% SGST]</option>
                <option value="Exempt 0%">Exempt 0%</option>
              </select>
            </div>

            {/* Inter State Tax */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Inter State Tax Rate
              </label>
              <select
                value={interStateTax}
                onChange={(e) => setInterStateTax(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="IGST 18%">IGST 18%</option>
                <option value="IGST 12%">IGST 12%</option>
                <option value="IGST 28%">IGST 28%</option>
                <option value="IGST 5%">IGST 5%</option>
                <option value="Exempt 0%">Exempt 0%</option>
              </select>
            </div>
          </div>
        </section>

        {/* SECTION 6: Track Inventory for this item */}
        <section className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="trackInventoryCheckbox"
                checked={trackInventory}
                onChange={(e) => setTrackInventory(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-slate-300 dark:border-slate-700"
              />
              <label htmlFor="trackInventoryCheckbox" className="text-base font-bold text-slate-900 dark:text-white cursor-pointer">
                Track Inventory for this item
              </label>
              <div className="group relative cursor-pointer" title="Keep real-time stock levels, stock movements, and automatic valuation">
                <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-6">
              You cannot enable/disable Inventory tracking once you&apos;ve created transactions for this item
            </p>
          </div>

          {trackInventory && (
            <div className="space-y-6 pt-2">
              {/* Bin Location & Tracking Radios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Bin Location Tracking */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Bin Location Tracking
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="binTracking"
                        checked={binLocationTracking === "Yes"}
                        onChange={() => setBinLocationTracking("Yes")}
                        className="h-4 w-4 text-blue-600 border-slate-300 dark:border-slate-700"
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="binTracking"
                        checked={binLocationTracking === "No"}
                        onChange={() => setBinLocationTracking("No")}
                        className="h-4 w-4 text-blue-600 border-slate-300 dark:border-slate-700"
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                {/* Inventory Tracking */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Inventory Tracking
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="invTrackMode"
                        checked={inventoryTracking === "None"}
                        onChange={() => setInventoryTracking("None")}
                        className="h-4 w-4 text-blue-600 border-slate-300 dark:border-slate-700"
                      />
                      <span>None</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="invTrackMode"
                        checked={inventoryTracking === "Serial"}
                        onChange={() => setInventoryTracking("Serial")}
                        className="h-4 w-4 text-blue-600 border-slate-300 dark:border-slate-700"
                      />
                      <span>Serial</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="invTrackMode"
                        checked={inventoryTracking === "Batch"}
                        onChange={() => setInventoryTracking("Batch")}
                        className="h-4 w-4 text-blue-600 border-slate-300 dark:border-slate-700"
                      />
                      <span>Batch</span>
                    </label>
                  </div>
                </div>

              </div>

              {/* Accounts & Valuation Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Inventory Account */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Inventory Account<span className="text-rose-500 ml-0.5">*</span>
                  </label>
                  <select
                    value={inventoryAccount}
                    onChange={(e) => setInventoryAccount(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Inventory Asset">Inventory Asset</option>
                    <option value="Finished Goods Stock">Finished Goods Stock</option>
                    <option value="Raw Materials Stock">Raw Materials Stock</option>
                  </select>
                </div>

                {/* Valuation Method */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Inventory Valuation Method<span className="text-rose-500 ml-0.5">*</span>
                  </label>
                  <select
                    value={valuationMethod}
                    onChange={(e) => setValuationMethod(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="FIFO (First In, First Out)">FIFO (First In, First Out)</option>
                    <option value="Weighted Average">Weighted Average</option>
                    <option value="LIFO (Last In, First Out)">LIFO (Last In, First Out)</option>
                  </select>
                </div>

              </div>

              {/* Reorder Point & Opening Stock */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Reorder Point
                  </label>
                  <Input
                    type="number"
                    value={reorderPoint}
                    onChange={(e) => setReorderPoint(e.target.value)}
                    placeholder="10"
                    className="h-10 text-sm bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Opening Stock (Initial Qty)
                  </label>
                  <Input
                    type="number"
                    value={openingStock}
                    onChange={(e) => setOpeningStock(e.target.value)}
                    placeholder="0"
                    className="h-10 text-sm bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Opening Stock Warehouse
                  </label>
                  <select
                    value={initialWarehouse}
                    onChange={(e) => setInitialWarehouse(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Main Central Warehouse">Main Central Warehouse (WH-001)</option>
                    <option value="North Regional Hub">North Regional Hub (WH-002)</option>
                    <option value="West Logistics Hub">West Logistics Hub (WH-003)</option>
                  </select>
                </div>
              </div>

            </div>
          )}
        </section>

        {/* SECTION 7: Cancellation and Returns */}
        <section className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 sm:p-8 space-y-4">
          <div className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            Cancellation and Returns
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Returnable Item</span>
              <span title="Can this item be returned by clients?">
                <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
              </span>
            </div>
            <div className="sm:col-span-3 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input
                  type="radio"
                  name="returnableOpt"
                  checked={returnable === "Yes"}
                  onChange={() => setReturnable("Yes")}
                  className="h-4 w-4 text-blue-600 border-slate-300 dark:border-slate-700"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input
                  type="radio"
                  name="returnableOpt"
                  checked={returnable === "No"}
                  onChange={() => setReturnable("No")}
                  className="h-4 w-4 text-blue-600 border-slate-300 dark:border-slate-700"
                />
                <span>No</span>
              </label>
            </div>
          </div>
        </section>

        {/* SECTION 8: Fulfilment Details */}
        <section className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            Fulfilment Details
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Dimensions */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Dimensions
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={dimLength}
                  onChange={(e) => setDimLength(e.target.value)}
                  placeholder="Length"
                  className="h-10 text-xs bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800"
                />
                <span className="text-slate-400 text-xs font-semibold">x</span>
                <Input
                  type="number"
                  value={dimWidth}
                  onChange={(e) => setDimWidth(e.target.value)}
                  placeholder="Width"
                  className="h-10 text-xs bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800"
                />
                <span className="text-slate-400 text-xs font-semibold">x</span>
                <Input
                  type="number"
                  value={dimHeight}
                  onChange={(e) => setDimHeight(e.target.value)}
                  placeholder="Height"
                  className="h-10 text-xs bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800"
                />
                <select
                  value={dimUnit}
                  onChange={(e) => setDimUnit(e.target.value)}
                  className="w-20 h-10 px-2 text-xs rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800"
                >
                  <option value="cm">cm</option>
                  <option value="mm">mm</option>
                  <option value="in">in</option>
                  <option value="m">m</option>
                  <option value="ft">ft</option>
                </select>
              </div>
              <p className="text-[10px] text-slate-400">Length X Width X Height</p>
            </div>

            {/* Weight */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Weight
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Gross weight"
                  className="h-10 text-xs bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800"
                />
                <select
                  value={weightUnit}
                  onChange={(e) => setWeightUnit(e.target.value)}
                  className="w-24 h-10 px-2 text-xs rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800"
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="lb">lb</option>
                  <option value="oz">oz</option>
                </select>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-6 py-3.5 shadow-lg">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Enterprise Inventory Rule: Auto-calculates Real-time Weighted Ledger Values</span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push("/app/accounts/inventory/items")}
              className="text-xs h-9 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            {!isEditMode && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={() => handleSave(true)}
                className="text-xs h-9 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Save & New
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              disabled={isSubmitting}
              onClick={() => handleSave(false)}
              className="text-xs h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm gap-1.5 px-6"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {isEditMode ? "Save Changes" : "Save"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function NewInventoryItemPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B132B] flex items-center justify-center text-xs text-slate-400">
          Loading product editor...
        </div>
      }
    >
      <InventoryItemFormContent />
    </Suspense>
  );
}
