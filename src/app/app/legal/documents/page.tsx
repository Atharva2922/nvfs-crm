"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { LegalNav } from "@/modules/legal/components/legal-nav";
import {
  FileCheck2,
  Search,
  RefreshCw,
  Plus,
  FileText,
  ExternalLink,
  History,
  X,
  Upload,
  Calendar,
  Layers,
} from "lucide-react";

export default function DocumentVaultPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // New Document Modal
  const [newDocModalOpen, setNewDocModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("CONTRACT");
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [changeDesc, setChangeDesc] = useState("");
  const [uploading, setUploading] = useState(false);

  // New Version Modal
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [newVersionFileName, setNewVersionFileName] = useState("");
  const [newVersionFileUrl, setNewVersionFileUrl] = useState("");
  const [newVersionDesc, setNewVersionDesc] = useState("");
  const [uploadingVersion, setUploadingVersion] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [search, typeFilter, page]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter !== "ALL") params.set("documentType", typeFilter);
      params.set("page", page.toString());
      params.set("limit", "20");

      const res = await fetch(`/api/legal/documents?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setDocuments(json.data.items);
        setTotalPages(json.data.pagination.totalPages || 1);
        setTotalCount(json.data.pagination.total || 0);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fileName.trim() || !fileUrl.trim()) return;

    try {
      setUploading(true);
      const res = await fetch("/api/legal/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          documentType,
          fileName: fileName.trim(),
          fileUrl: fileUrl.trim(),
          changeDescription: changeDesc || "Initial revision (v1)",
        }),
      });

      const json = await res.json();
      if (json.success) {
        setNewDocModalOpen(false);
        setTitle("");
        setFileName("");
        setFileUrl("");
        setChangeDesc("");
        fetchDocuments();
      } else {
        alert(json.error?.message || "Failed to create document");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create document");
    } finally {
      setUploading(false);
    }
  };

  const handleAddVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !newVersionFileName.trim() || !newVersionFileUrl.trim()) return;

    try {
      setUploadingVersion(true);
      const res = await fetch("/api/legal/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: selectedDoc.id,
          fileName: newVersionFileName.trim(),
          fileUrl: newVersionFileUrl.trim(),
          changeDescription: newVersionDesc || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setVersionModalOpen(false);
        setSelectedDoc(null);
        setNewVersionFileName("");
        setNewVersionFileUrl("");
        setNewVersionDesc("");
        fetchDocuments();
      } else {
        alert(json.error?.message || "Failed to upload version");
      }
    } catch (err: any) {
      alert(err.message || "Failed to upload version");
    } finally {
      setUploadingVersion(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Document Repository & Version Vault"
          description="Immutable revision control for corporate contracts, court filings, statutory proofs, and governance charters."
        />
        <button
          onClick={() => setNewDocModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Upload Document</span>
        </button>
      </div>

      <LegalNav />

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search document vault by title, filename..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 focus:border-blue-500/50 focus:outline-none w-full sm:w-auto"
        >
          <option value="ALL">All Categories</option>
          <option value="CONTRACT">Contract</option>
          <option value="AGREEMENT">Agreement</option>
          <option value="AMENDMENT">Amendment</option>
          <option value="COURT_FILING">Court Filing</option>
          <option value="COMPLIANCE_EVIDENCE">Compliance Evidence</option>
          <option value="POLICY">Governance Policy</option>
          <option value="CERTIFICATE">Certificate</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Documents Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d131f] overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
          </div>
        ) : documents.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <FileCheck2 className="mx-auto h-8 w-8 text-slate-600" />
            <p className="text-sm font-semibold">No documents found in vault</p>
            <p className="text-xs text-slate-500">Upload agreements, redlines, or court evidence.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Latest File</th>
                  <th className="py-3 px-4">Current Version</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4">Uploaded By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-200 block">{doc.title}</span>
                      {doc.contract && (
                        <Link href={`/app/legal/contracts/${doc.contractId}`} className="text-[11px] text-amber-400 hover:underline">
                          Contract: {doc.contract.contractNumber}
                        </Link>
                      )}
                      {doc.case && (
                        <Link href={`/app/legal/cases/${doc.caseId}`} className="text-[11px] text-purple-400 hover:underline">
                          Case: {doc.case.caseNumber}
                        </Link>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 font-medium">
                        {doc.documentType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <span className="font-mono text-[11px]">{doc.latestFileName}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 font-mono text-[10px] font-bold">
                        v{doc.currentVersion}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {formatDate(doc.updatedAt)}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {doc.uploadedBy ? `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}` : "User"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedDoc(doc);
                            setNewVersionFileName(doc.latestFileName);
                            setVersionModalOpen(true);
                          }}
                          className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-300 hover:bg-slate-700 text-[11px] font-medium"
                        >
                          + Version
                        </button>
                        <a
                          href={doc.latestFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded bg-blue-600/20 border border-blue-500/30 px-2 py-1 text-blue-300 hover:bg-blue-600/30 text-[11px] font-medium flex items-center gap-1"
                        >
                          <span>Open</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-200">{documents.length}</span> of{" "}
            <span className="font-semibold text-slate-200">{totalCount}</span> documents
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded border border-slate-800 px-2.5 py-1 disabled:opacity-40 hover:bg-slate-800 text-slate-300"
            >
              Previous
            </button>
            <span className="text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded border border-slate-800 px-2.5 py-1 disabled:opacity-40 hover:bg-slate-800 text-slate-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Upload New Document Modal */}
      {newDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-400" />
                Upload New Legal Document
              </h3>
              <button onClick={() => setNewDocModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Supply Agreement"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-blue-500/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Document Category</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-blue-500/50 focus:outline-none"
                >
                  <option value="CONTRACT">Contract</option>
                  <option value="AGREEMENT">Agreement</option>
                  <option value="AMENDMENT">Amendment</option>
                  <option value="COURT_FILING">Court Filing</option>
                  <option value="COMPLIANCE_EVIDENCE">Compliance Evidence</option>
                  <option value="POLICY">Governance Policy</option>
                  <option value="CERTIFICATE">Certificate</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">File Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="agreement_v1.pdf"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-blue-500/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">File Storage URL *</label>
                  <input
                    type="text"
                    required
                    placeholder="/vault/agreements/v1.pdf"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-blue-500/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Initial Revision Description</label>
                <input
                  type="text"
                  placeholder="e.g. Initial draft submitted for review"
                  value={changeDesc}
                  onChange={(e) => setChangeDesc(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-blue-500/50 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewDocModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-white font-medium hover:bg-blue-500 disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Save Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Version Modal */}
      {versionModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-400" />
                Upload New Version for &ldquo;{selectedDoc.title}&rdquo;
              </h3>
              <button onClick={() => setVersionModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddVersion} className="space-y-4 text-xs">
              <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-2.5 text-slate-300">
                Current Version: <strong className="text-amber-400 font-mono">v{selectedDoc.currentVersion}</strong> → New Version: <strong className="text-emerald-400 font-mono">v{selectedDoc.currentVersion + 1}</strong>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">New File Name *</label>
                <input
                  type="text"
                  required
                  value={newVersionFileName}
                  onChange={(e) => setNewVersionFileName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-blue-500/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">New Storage File URL *</label>
                <input
                  type="text"
                  required
                  placeholder="/vault/agreements/v2.pdf"
                  value={newVersionFileUrl}
                  onChange={(e) => setNewVersionFileUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-blue-500/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Revision / Change Log *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Summary of amendments made in this version..."
                  value={newVersionDesc}
                  onChange={(e) => setNewVersionDesc(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-200 focus:border-blue-500/50 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setVersionModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingVersion}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-white font-medium hover:bg-blue-500 disabled:opacity-50"
                >
                  {uploadingVersion ? "Publishing..." : `Publish v${selectedDoc.currentVersion + 1}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
