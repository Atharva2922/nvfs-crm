'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { OperationsNav } from '@/modules/operations/components/operations-nav';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  Clock,
  CheckCircle2,
  Filter,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

interface TimelineItem {
  id: string;
  type: 'operation' | 'milestone' | 'task';
  title: string;
  code?: string;
  operationId?: string;
  operationName?: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: string;
  priority?: string;
  isDelayed?: boolean;
  assignedTo?: string;
  dependencyId?: string;
}

export default function OperationsTimelinePage() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [filterType, setFilterType] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    fetchTimeline();
  }, []);

  async function fetchTimeline() {
    try {
      setLoading(true);
      const res = await fetch('/api/operations/timeline');
      const json = await res.json();
      if (json.success && json.data) {
        setItems(json.data);
      }
    } catch (err) {
      console.error('Failed to load timeline data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Calculate the viewing date range
  const daysToShow = viewMode === 'day' ? 14 : viewMode === 'week' ? 35 : 90;
  const startRange = new Date(currentDate);
  startRange.setDate(startRange.getDate() - Math.floor(daysToShow / 4));

  const endRange = new Date(startRange);
  endRange.setDate(endRange.getDate() + daysToShow);

  const totalTimeSpan = endRange.getTime() - startRange.getTime();

  const handlePrev = () => {
    const next = new Date(currentDate);
    const step = viewMode === 'day' ? 7 : viewMode === 'week' ? 14 : 30;
    next.setDate(next.getDate() - step);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    const step = viewMode === 'day' ? 7 : viewMode === 'week' ? 14 : 30;
    next.setDate(next.getDate() + step);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Generate date columns
  const dateColumns: { label: string; date: Date; isToday: boolean }[] = [];
  const stepDays = viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : 14;

  const curCol = new Date(startRange);
  while (curCol <= endRange) {
    const isToday = new Date().toDateString() === curCol.toDateString();
    let label = '';
    if (viewMode === 'day') {
      label = curCol.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } else if (viewMode === 'week') {
      label = `Wk ${curCol.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    } else {
      label = curCol.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    }
    dateColumns.push({ label, date: new Date(curCol), isToday });
    curCol.setDate(curCol.getDate() + stepDays);
  }

  const filteredItems = items.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  const getPositionStyles = (startStr: string, endStr: string) => {
    const start = new Date(startStr).getTime();
    const end = new Date(endStr).getTime();

    let left = ((start - startRange.getTime()) / totalTimeSpan) * 100;
    let width = ((Math.max(end - start, 86400000)) / totalTimeSpan) * 100;

    // Constrain to display
    if (left < 0) {
      width += left;
      left = 0;
    }
    if (left + width > 100) {
      width = 100 - left;
    }

    return {
      left: `${Math.max(0, left)}%`,
      width: `${Math.max(1.5, Math.min(100, width))}%`,
    };
  };

  const getStatusColor = (item: TimelineItem) => {
    if (item.isDelayed) return 'bg-rose-500/80 border-rose-400 text-rose-100';
    if (item.status === 'COMPLETED') return 'bg-emerald-500/80 border-emerald-400 text-emerald-100';
    if (item.status === 'IN_PROGRESS' || item.status === 'ACTIVE') return 'bg-blue-500/80 border-blue-400 text-blue-100';
    if (item.status === 'ON_HOLD') return 'bg-amber-500/80 border-amber-400 text-amber-100';
    return 'bg-purple-500/70 border-purple-400 text-purple-100';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <OperationsNav />

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">Operations Gantt & Timeline</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Interactive Schedule
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Visualize cross-departmental operations, milestones, dependencies, and critical completion horizons.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Zoom */}
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'day' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'week' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'month' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Month
              </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg">
              <button
                onClick={handlePrev}
                className="p-2 text-slate-400 hover:text-white transition-colors border-r border-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                Today
              </button>
              <button
                onClick={handleNext}
                className="p-2 text-slate-400 hover:text-white transition-colors border-l border-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-transparent border-0 text-slate-300 focus:outline-none focus:ring-0 cursor-pointer"
              >
                <option value="all" className="bg-slate-900">All Tracks</option>
                <option value="operation" className="bg-slate-900">Operations Only</option>
                <option value="milestone" className="bg-slate-900">Milestones</option>
                <option value="task" className="bg-slate-900">Tasks</option>
              </select>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs text-slate-400 gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-slate-300">Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-500/80 border border-blue-400 inline-block"></span>
              <span>In Progress / Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500/80 border border-emerald-400 inline-block"></span>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500/80 border border-rose-400 inline-block"></span>
              <span>Delayed / Overdue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-purple-500/70 border border-purple-400 inline-block"></span>
              <span>Pending / Milestone</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span>Current Red Marker = Today</span>
          </div>
        </div>

        {/* Gantt Timeline Container */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center text-slate-400">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm">Synthesizing operation schedule telemetry...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-24 text-center text-slate-400">
              <Layers className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="text-base font-medium text-slate-300">No scheduled timeline items found</p>
              <p className="text-sm mt-1">Create operations with start and end dates to visualize them here.</p>
              <Link
                href="/app/operations/new"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Launch New Operation
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                {/* Header Grid */}
                <div className="grid grid-cols-12 border-b border-slate-800 bg-slate-900/90 text-xs font-semibold text-slate-400 select-none">
                  <div className="col-span-4 p-3 border-r border-slate-800">
                    Track / Operation / Item
                  </div>
                  <div className="col-span-8 relative flex items-center h-10">
                    {dateColumns.map((col, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 text-center py-2 border-r border-slate-800/40 text-[11px] truncate ${
                          col.isToday ? 'text-indigo-400 font-bold bg-indigo-950/30' : ''
                        }`}
                      >
                        {col.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-slate-800/60 relative">
                  {/* Today line overlay */}
                  {(() => {
                    const todayTime = new Date().getTime();
                    if (todayTime >= startRange.getTime() && todayTime <= endRange.getTime()) {
                      const todayPct = ((todayTime - startRange.getTime()) / totalTimeSpan) * 100;
                      return (
                        <div
                          style={{ left: `calc(33.333% + (66.666% * ${todayPct / 100}))` }}
                          className="absolute top-0 bottom-0 w-0.5 bg-rose-500/80 z-10 pointer-events-none"
                        >
                          <span className="absolute -top-2 -translate-x-1/2 px-1 py-0.5 bg-rose-500 text-[9px] font-bold text-white rounded">
                            TODAY
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {filteredItems.map((item) => {
                    const styles = getPositionStyles(item.startDate, item.endDate);
                    const isOp = item.type === 'operation';

                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        className={`grid grid-cols-12 items-center hover:bg-slate-800/30 transition-colors ${
                          isOp ? 'bg-slate-900/40' : ''
                        }`}
                      >
                        {/* Label Col */}
                        <div className="col-span-4 p-3 border-r border-slate-800/80 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {item.type === 'operation' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  OP
                                </span>
                              )}
                              {item.type === 'milestone' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  MILESTONE
                                </span>
                              )}
                              {item.type === 'task' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300">
                                  TASK
                                </span>
                              )}
                              <p className="text-xs font-semibold text-slate-200 truncate" title={item.title}>
                                {item.title}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                              <span>
                                {new Date(item.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} –{' '}
                                {new Date(item.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                              {item.isDelayed && (
                                <span className="text-rose-400 font-semibold flex items-center gap-0.5">
                                  <AlertCircle className="w-2.5 h-2.5" /> Delayed
                                </span>
                              )}
                            </div>
                          </div>

                          {item.operationId ? (
                            <Link
                              href={`/app/operations/${item.operationId}`}
                              className="text-slate-400 hover:text-indigo-400 p-1 transition-colors"
                              title="Open Workspace"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          ) : (
                            <Link
                              href={`/app/operations/${item.id}`}
                              className="text-slate-400 hover:text-indigo-400 p-1 transition-colors"
                              title="Open Operation"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>

                        {/* Gantt Bar Col */}
                        <div className="col-span-8 h-12 relative flex items-center px-1">
                          <div
                            style={{ left: styles.left, width: styles.width }}
                            className={`absolute h-7 rounded-md border flex items-center px-2 shadow-md transition-all group overflow-hidden ${getStatusColor(
                              item
                            )}`}
                          >
                            {/* Inner progress bar */}
                            <div
                              style={{ width: `${item.progress}%` }}
                              className="absolute left-0 top-0 bottom-0 bg-white/20 pointer-events-none rounded-l-md"
                            />
                            <div className="relative z-10 flex items-center justify-between w-full text-[11px] font-medium truncate">
                              <span className="truncate">{item.title}</span>
                              <span className="ml-1 text-[10px] font-bold opacity-80">{item.progress}%</span>
                            </div>

                            {/* Tooltip on hover */}
                            <div className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2 shadow-2xl z-30 whitespace-nowrap pointer-events-none">
                              <p className="font-bold text-white">{item.title}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {new Date(item.startDate).toLocaleDateString()} to {new Date(item.endDate).toLocaleDateString()}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-[10px]">
                                <span>Status: {item.status}</span>
                                <span>•</span>
                                <span>Progress: {item.progress}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
