import React from "react";
import Link from "next/link";
import { Shell } from "@/components/layout/shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Clock, Layers, Sparkles } from "lucide-react";

interface ModuleStatusProps {
  moduleName: string;
  category: string;
  blockNumber: number;
  description: string;
  entities: string[];
  plannedCapabilities: string[];
}

export function ModuleStatusView({
  moduleName,
  category,
  blockNumber,
  description,
  entities,
  plannedCapabilities,
}: ModuleStatusProps) {
  return (
    <Shell>
      <div className="space-y-6">
        {/* Navigation back */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Enterprise Overview</span>
          </Link>
        </div>

        {/* Banner */}
        <div className="rounded-lg border border-slate-800 bg-[#0f172a] p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge variant="info" size="sm">
                  {category}
                </Badge>
                <span className="text-[11px] font-mono text-slate-400">
                  Target: Block {blockNumber}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {moduleName}
              </h1>
              <p className="max-w-2xl text-xs text-slate-300 leading-relaxed">
                {description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-md border border-blue-800/40 bg-blue-950/40 px-3 py-1.5 text-xs font-medium text-blue-300">
                <Clock className="h-3.5 w-3.5" />
                <span>Next in Phased Roadmap</span>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Shared Entity Schema (Single Source of Truth)</CardTitle>
              <CardDescription>
                Database entities linking this module to HR, Finance, and Leadership
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {entities.map((e) => (
                <div
                  key={e}
                  className="flex items-center gap-2 rounded border border-slate-800 bg-slate-900/60 p-2 text-xs text-slate-300"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="font-mono text-[11px]">{e}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Planned Production Capabilities</CardTitle>
              <CardDescription>
                Strict enterprise features scheduled for Block {blockNumber}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {plannedCapabilities.map((cap) => (
                <div
                  key={cap}
                  className="flex items-center gap-2 rounded border border-slate-800 bg-slate-900/60 p-2 text-xs text-slate-300"
                >
                  <Sparkles className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span>{cap}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
