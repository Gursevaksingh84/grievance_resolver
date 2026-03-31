/**
 * Grievance Resolver — Admin Command Center (Redesigned)
 * 
 * FILE STRUCTURE:
 * ├── GrievanceAdminShell.jsx  ← this file (root shell + router state)
 * │   ├── <AdminShell />        full-viewport layout, sticky topbar, sidebar nav
 * │   ├── <DashboardPage />     overview: KPIs + latest 5 complaints + latest 5 agent events
 * │   ├── <ComplaintsPage />    searchable/filterable complaint list
 * │   └── <ComplaintDetail />   detail panel/modal with audit trail + actions
 *
 * INTEGRATION NOTES:
 * - Replace mock data hooks (useMockData) with your real axios calls (see comments)
 * - The API surface matches your existing endpoints:
 *     GET  /api/admin/dashboard       → metrics
 *     GET  /api/admin/complaints      → complaints[]
 *     PATCH /api/admin/complaints/:id/status  → status update
 * - Import useTranslation from "../hooks/useTranslation" for i18n
 * - CSS variables defined in :root match your existing Dashboard.css tokens
 * - Drop-in: replace <Dashboard /> with <GrievanceAdminShell /> in your router
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    LayoutDashboard, FileText, AlertTriangle, CheckCircle2,
    Clock, ShieldAlert, BarChart3, TrendingUp, RefreshCw,
    Brain, Zap, Activity, Scale, ChevronRight, Lock,
    Search, Filter, ArrowLeft, X, Circle, Menu,
    Building2, MapPin, Calendar, Hash, User, ChevronDown,
} from "lucide-react";
import axios from 'axios'
import { API_URL } from '../lib/config'
// ─── Design tokens (mirror your existing Dashboard.css :root) ──────
const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #f0f4f8;
  --surface: #ffffff;
  --surface-2: #f8fafc;
  --border: #e2e8f0;
  --border-2: #cbd5e1;
  --text-900: #0f172a;
  --text-700: #334155;
  --text-500: #64748b;
  --text-400: #94a3b8;
  --blue: #2563eb;
  --blue-lt: #dbeafe;
  --c-open: #1d4ed8; --c-open-bg: #dbeafe;
  --c-prog: #b45309; --c-prog-bg: #fef3c7;
  --c-esc: #dc2626;  --c-esc-bg: #fee2e2;
  --c-res: #047857;  --c-res-bg: #d1fae5;
  --c-closed: #64748b; --c-closed-bg: #f1f5f9;
  --u-urgent: #dc2626; --u-urgent-bg: #fee2e2;
  --u-high: #c2410c;   --u-high-bg: #ffedd5;
  --u-medium: #1d4ed8; --u-medium-bg: #dbeafe;
  --u-low: #047857;    --u-low-bg: #d1fae5;
  --shadow-sm: 0 1px 3px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,.09), 0 2px 4px rgba(0,0,0,.04);
  --shadow-lg: 0 12px 32px rgba(0,0,0,.12), 0 4px 8px rgba(0,0,0,.06);
  --r-sm: 5px; --r-md: 8px; --r-lg: 12px;
  --font: 'DM Sans', system-ui, sans-serif;
  --mono: 'DM Mono', 'Courier New', monospace;
}

html, body, #root { height: 100%; }

/* ── Admin Shell ─────────────────────────────────────────────────── */
.adm {
  display: block;
  min-height: 100%;
  font-family: var(--font);
  background: var(--bg);
  color: var(--text-900);
}

/* ── Topbar ───────────────────────────────────────────────────────── */
.adm-top {
  flex: 0 0 54px; background: var(--surface); border-bottom: 1px solid var(--border);
  display: flex; align-items: center; padding: 0 1.5rem;
  gap: 1rem; z-index: 300; box-shadow: var(--shadow-sm);
}
.adm-top-logo { display: flex; align-items: center; gap: 0.625rem; }
.adm-top-logo-icon { width: 32px; height: 32px; border-radius: var(--r-md); background: var(--blue); display: grid; place-items: center; }
.adm-top-logo-name { font-size: 0.9375rem; font-weight: 700; color: var(--text-900); letter-spacing: -0.01em; }
.adm-top-logo-sub  { font-size: 0.75rem; color: var(--text-500); margin-top: 1px; }
.adm-top-sep  { width: 1px; height: 20px; background: var(--border-2); margin: 0 0.25rem; }
.adm-top-nav  { display: flex; align-items: center; gap: 0.25rem; flex: 1; }
.adm-top-nav-item {
  display: flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem;
  border-radius: var(--r-md); font-size: 0.8125rem; font-weight: 500; color: var(--text-500);
  cursor: pointer; border: none; background: transparent; transition: all .15s;
}
.adm-top-nav-item:hover { background: var(--surface-2); color: var(--text-700); }
.adm-top-nav-item.active { background: var(--blue-lt); color: var(--blue); font-weight: 600; }
.adm-top-right { display: flex; align-items: center; gap: 0.75rem; margin-left: auto; }
.live-pill {
  display: flex; align-items: center; gap: 0.375rem; padding: 0.3125rem 0.75rem;
  background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 999px;
  font-size: 0.75rem; font-weight: 600; color: #15803d; font-family: var(--mono);
}
.live-dot { width: 6px; height: 6px; border-radius: 50%; background: #16a34a; animation: pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
.btn-refresh {
  display: flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.875rem;
  border: 1px solid var(--border-2); border-radius: var(--r-md); background: var(--surface);
  font-size: 0.8125rem; font-weight: 500; color: var(--text-700); cursor: pointer; transition: all .15s;
}
.btn-refresh:hover { border-color: var(--blue); color: var(--blue); }
.mock-badge { padding: 0.2rem 0.5rem; border-radius: 4px; background: #fef08a; color: #854d0e; font-size: 0.6875rem; font-weight: 700; font-family: var(--mono); letter-spacing: .04em; }

/* ── Body split ───────────────────────────────────────────────────── */
.adm-body {
  display: block;
}

.adm-content {
  width: 100%;
  overflow: visible;
}

/* ── Page wrapper ─────────────────────────────────────────────────── */
.page { padding: 1.75rem 2rem; max-width: 100%; }
.page-head { margin-bottom: 1.75rem; }
.page-title { font-size: 1.375rem; font-weight: 700; color: var(--text-900); letter-spacing: -0.025em; }
.page-meta  { font-size: 0.8125rem; color: var(--text-500); margin-top: 0.25rem; display: flex; align-items: center; gap: 0.5rem; }
.page-meta-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--text-400); }

/* ── KPI cards (Kumbh-style) ─────────────────────────────────────── */
.kpi-grid {
  display: grid; grid-template-columns: repeat(6, 1fr); gap: 1rem; margin-bottom: 1.75rem;
}
@media (max-width: 1280px) { .kpi-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 768px)  { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }

.kpi {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg);
  padding: 1.25rem 1.375rem; box-shadow: var(--shadow-sm); position: relative; overflow: hidden;
  transition: box-shadow .2s;
}
.kpi:hover { box-shadow: var(--shadow-md); }
.kpi--alert { border-color: #fecaca; background: #fff5f5; }
.kpi-icon-wrap {
  width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center;
  margin-bottom: 0.875rem; background: var(--kpi-icon-bg, #f1f5f9);
}
.kpi-num { font-size: 1.875rem; font-weight: 700; line-height: 1; font-family: var(--mono); color: var(--kpi-num-color, var(--text-900)); letter-spacing: -0.02em; }
.kpi-label { font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: var(--text-400); margin-top: 0.375rem; }
.kpi-sub { font-size: 0.75rem; color: var(--text-500); margin-top: 0.25rem; }
.kpi-accent-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: var(--kpi-accent, var(--blue)); }

/* ── Two-col intel grid ───────────────────────────────────────────── */
.intel-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.75rem; }
@media (max-width: 900px) { .intel-grid { grid-template-columns: 1fr; } }

/* ── Three-col bottom grid ────────────────────────────────────────── */
.bottom-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.25rem; }
@media (max-width: 1100px) { .bottom-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 700px)  { .bottom-grid { grid-template-columns: 1fr; } }

/* ── Panel card ───────────────────────────────────────────────────── */
.panel {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg);
  box-shadow: var(--shadow-sm); display: flex; flex-direction: column; overflow: hidden;
}
.panel-hd {
  padding: 0.875rem 1.125rem; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
}
.panel-hd-l { display: flex; align-items: center; gap: 0.5rem; }
.panel-title { font-size: 0.8125rem; font-weight: 600; color: var(--text-900); }
.panel-body { flex: 1; overflow-y: auto; }
.panel-footer {
  padding: 0.625rem 1.125rem; border-top: 1px solid var(--border);
  display: flex; justify-content: flex-end;
}
.view-more-btn {
  font-size: 0.75rem; font-weight: 500; color: var(--blue); cursor: pointer;
  border: none; background: transparent; display: flex; align-items: center; gap: 0.25rem;
  padding: 0; transition: opacity .15s;
}
.view-more-btn:hover { opacity: .75; }

/* ── Badges ───────────────────────────────────────────────────────── */
.pbadge { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.6875rem; font-weight: 700; font-family: var(--mono); letter-spacing: .03em; }
.pbadge--red   { background: #fee2e2; color: #dc2626; }
.pbadge--blue  { background: #dbeafe; color: #1d4ed8; }
.pbadge--green { background: #dcfce7; color: #15803d; }
.pbadge--amber { background: #fef3c7; color: #b45309; }

.chip { display: inline-flex; align-items: center; padding: 0.2rem 0.5rem; border-radius: var(--r-sm); font-size: 0.6875rem; font-weight: 700; font-family: var(--mono); letter-spacing: .03em; text-transform: uppercase; }
.chip--open       { background: var(--c-open-bg);   color: var(--c-open); }
.chip--in_progress{ background: var(--c-prog-bg);   color: var(--c-prog); }
.chip--escalated  { background: var(--c-esc-bg);    color: var(--c-esc); }
.chip--resolved   { background: var(--c-res-bg);    color: var(--c-res); }
.chip--closed     { background: var(--c-closed-bg); color: var(--c-closed); }
.chip--urgent  { background: var(--u-urgent-bg); color: var(--u-urgent); }
.chip--high    { background: var(--u-high-bg);   color: var(--u-high); }
.chip--medium  { background: var(--u-medium-bg); color: var(--u-medium); }
.chip--low     { background: var(--u-low-bg);    color: var(--u-low); }

.sla-chip { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.2rem 0.5rem; border-radius: var(--r-sm); font-size: 0.6875rem; font-weight: 600; font-family: var(--mono); }
.sla-chip--breached { background: #fee2e2; color: #dc2626; }
.sla-chip--warning  { background: #fef3c7; color: #b45309; }
.sla-chip--ok       { background: #f1f5f9; color: var(--text-500); }

/* ── Dashboard: Live complaint row ───────────────────────────────── */
.cfi { padding: 0.875rem 1.125rem; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 0.375rem; }
.cfi:last-child { border-bottom: none; }
.cfi-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }
.cfi-title { font-size: 0.8125rem; font-weight: 500; color: var(--text-900); line-height: 1.4; flex: 1; }
.cfi-id { font-size: 0.6875rem; font-family: var(--mono); color: var(--text-400); white-space: nowrap; }
.cfi-chips { display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap; }
.cfi-meta { font-size: 0.6875rem; color: var(--text-400); display: flex; align-items: center; gap: 0.375rem; }
.score-pill { padding: 0.15rem 0.4rem; border-radius: 4px; background: #f1f5f9; font-size: 0.625rem; font-weight: 700; color: var(--text-500); font-family: var(--mono); }

/* ── Dashboard: Agent row ─────────────────────────────────────────── */
.agent-row { padding: 0.75rem 1.125rem; border-bottom: 1px solid var(--border); display: flex; align-items: flex-start; gap: 0.75rem; }
.agent-row:last-child { border-bottom: none; }
.agent-avatar { width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center; font-size: 0.625rem; font-weight: 700; color: #fff; flex-shrink: 0; font-family: var(--mono); }
.agent-body { flex: 1; min-width: 0; }
.agent-name { font-size: 0.75rem; font-weight: 600; color: var(--text-900); }
.agent-desc { font-size: 0.75rem; color: var(--text-500); line-height: 1.45; margin-top: 0.125rem; }
.agent-time { font-size: 0.6875rem; color: var(--text-400); font-family: var(--mono); white-space: nowrap; flex-shrink: 0; margin-top: 0.25rem; }

/* ── Dept bar row ─────────────────────────────────────────────────── */
.dept-row { padding: 0.75rem 1.125rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 0.75rem; }
.dept-row:last-child { border-bottom: none; }
.dept-icon { font-size: 1rem; flex-shrink: 0; }
.dept-col { flex: 1; min-width: 0; }
.dept-name { font-size: 0.8125rem; font-weight: 500; color: var(--text-900); }
.dept-bar-bg { height: 4px; border-radius: 2px; background: var(--border); margin: 0.3rem 0; }
.dept-bar-fill { height: 100%; border-radius: 2px; transition: width .6s ease; }
.dept-sub { font-size: 0.6875rem; color: var(--text-500); }
.breach { color: #dc2626; font-weight: 600; }
.dept-count { font-size: 0.875rem; font-weight: 700; font-family: var(--mono); color: var(--text-900); flex-shrink: 0; }

/* ── Escalation row ───────────────────────────────────────────────── */
.esc-row { padding: 0.75rem 1.125rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
.esc-row:last-child { border-bottom: none; }
.esc-title { font-size: 0.8125rem; font-weight: 500; color: var(--text-900); }
.esc-sub   { font-size: 0.6875rem; color: var(--text-400); margin-top: 0.25rem; }
.esc-red   { color: #dc2626; font-weight: 600; }
.esc-level-badge { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.6875rem; font-weight: 700; font-family: var(--mono); white-space: nowrap; flex-shrink: 0; }
.esc-l1 { background: #fef3c7; color: #b45309; }
.esc-l2 { background: #ffedd5; color: #c2410c; }
.esc-l3 { background: #fee2e2; color: #dc2626; }

/* ── Complaints page ──────────────────────────────────────────────── */
.complaints-bar { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.search-wrap { position: relative; flex: 1; min-width: 220px; max-width: 360px; }
.search-wrap svg { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); pointer-events: none; }
.search-input {
  width: 100%; padding: 0.5625rem 0.875rem 0.5625rem 2.25rem; border: 1px solid var(--border-2);
  border-radius: var(--r-md); font-size: 0.8125rem; font-family: var(--font); background: var(--surface);
  color: var(--text-900); outline: none; transition: border-color .15s;
}
.search-input:focus { border-color: var(--blue); }
.filter-chips { display: flex; align-items: center; gap: 0.375rem; flex-wrap: wrap; }
.fchip {
  padding: 0.375rem 0.875rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600;
  border: 1px solid var(--border-2); background: var(--surface); color: var(--text-500);
  cursor: pointer; transition: all .15s; font-family: var(--font);
}
.fchip.active { background: var(--blue); border-color: var(--blue); color: #fff; }
.fchip:hover:not(.active) { border-color: var(--blue); color: var(--blue); }
.filter-sel-wrap { position: relative; }
.filter-sel {
  padding: 0.4375rem 2rem 0.4375rem 0.75rem; border: 1px solid var(--border-2); border-radius: var(--r-md);
  font-size: 0.8125rem; font-family: var(--font); background: var(--surface); color: var(--text-700);
  cursor: pointer; appearance: none; outline: none;
}
.complaints-count { font-size: 0.8125rem; color: var(--text-500); margin-left: auto; white-space: nowrap; }

/* complaint list */
.complaint-list { display: flex; flex-direction: column; gap: 0; }
.cl-item {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg);
  padding: 1rem 1.25rem; display: flex; align-items: center; gap: 1rem;
  transition: box-shadow .15s; cursor: default; margin-bottom: 0.625rem;
  border-left: 3px solid var(--cl-accent, var(--border));
}
.cl-item:hover { box-shadow: var(--shadow-md); }
.cl-main { flex: 1; min-width: 0; }
.cl-id   { font-size: 0.6875rem; font-family: var(--mono); color: var(--text-400); margin-bottom: 0.25rem; }
.cl-title{ font-size: 0.875rem; font-weight: 600; color: var(--text-900); line-height: 1.35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cl-chips{ display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap; margin-top: 0.375rem; }
.cl-meta { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.375rem; flex-wrap: wrap; }
.cl-meta-item { font-size: 0.6875rem; color: var(--text-400); display: flex; align-items: center; gap: 0.25rem; }
.cl-action { flex-shrink: 0; }
.btn-view {
  padding: 0.4375rem 1rem; border: 1px solid var(--border-2); border-radius: var(--r-md);
  font-size: 0.8125rem; font-weight: 500; color: var(--text-700); background: var(--surface);
  cursor: pointer; display: flex; align-items: center; gap: 0.375rem; transition: all .15s;
}
.btn-view:hover { border-color: var(--blue); color: var(--blue); background: #eff6ff; }

/* ── Complaint detail panel ───────────────────────────────────────── */
.detail-overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,.35); z-index: 500;
  display: flex; justify-content: flex-end; animation: fadeIn .15s ease;
}
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
.detail-panel {
  width: min(660px, 95vw); height: 100%; background: var(--surface); overflow-y: auto;
  box-shadow: var(--shadow-lg); display: flex; flex-direction: column;
  animation: slideIn .2s ease;
}
@keyframes slideIn { from{transform:translateX(40px);opacity:0} to{transform:translateX(0);opacity:1} }
.detail-topbar {
  padding: 1rem 1.5rem; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
  position: sticky; top: 0; background: var(--surface); z-index: 10;
}
.detail-back { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; color: var(--text-500); cursor: pointer; border: none; background: transparent; transition: color .15s; padding: 0; }
.detail-back:hover { color: var(--text-900); }
.detail-close { width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--border); display: grid; place-items: center; cursor: pointer; background: transparent; transition: all .15s; }
.detail-close:hover { background: var(--surface-2); }
.detail-body { padding: 1.5rem; flex: 1; display: flex; flex-direction: column; gap: 1.25rem; }
.detail-header { display: flex; flex-direction: column; gap: 0.625rem; }
.detail-id { font-size: 0.75rem; font-family: var(--mono); color: var(--text-400); }
.detail-title { font-size: 1.125rem; font-weight: 700; color: var(--text-900); line-height: 1.35; }
.detail-chips { display: flex; align-items: center; gap: 0.375rem; flex-wrap: wrap; }
.detail-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.detail-meta-item { background: var(--surface-2); border-radius: var(--r-md); padding: 0.75rem; }
.detail-meta-key { font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--text-400); margin-bottom: 0.25rem; }
.detail-meta-val { font-size: 0.875rem; font-weight: 500; color: var(--text-900); }
.detail-section-title { font-size: 0.8125rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--text-400); }
.detail-desc { font-size: 0.875rem; line-height: 1.6; color: var(--text-700); background: var(--surface-2); border-radius: var(--r-md); padding: 1rem; }
.detail-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.btn-act {
  padding: 0.5rem 1.125rem; border-radius: var(--r-md); font-size: 0.8125rem; font-weight: 600;
  cursor: pointer; border: 1.5px solid transparent; display: flex; align-items: center; gap: 0.375rem; transition: all .15s;
}
.btn-act--prog  { border-color: #d97706; color: #b45309; background: #fffbeb; }
.btn-act--prog:hover  { background: #fef3c7; }
.btn-act--res   { border-color: #059669; color: #047857; background: #f0fdf4; }
.btn-act--res:hover   { background: #d1fae5; }
.btn-act--esc   { border-color: #dc2626; color: #dc2626; background: #fff5f5; }
.btn-act--esc:hover   { background: #fee2e2; }
.btn-act--close { border-color: var(--border-2); color: var(--text-500); background: var(--surface-2); }
.btn-act--close:hover { background: #f1f5f9; }
.btn-act--primary { border-color: var(--blue); color: #fff; background: var(--blue); }
.btn-act--primary:hover { background: #1d4ed8; }
.btn-act:disabled { opacity: .45; cursor: not-allowed; }

/* action edit form */
.action-form { background: var(--surface-2); border-radius: var(--r-lg); padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; border: 1px solid var(--border); }
.action-form-label { font-size: 0.75rem; font-weight: 600; color: var(--text-700); }
.action-textarea {
  width: 100%; padding: 0.625rem 0.75rem; border: 1px solid var(--border-2); border-radius: var(--r-md);
  font-size: 0.8125rem; font-family: var(--font); color: var(--text-900); background: var(--surface);
  outline: none; resize: vertical; transition: border-color .15s;
}
.action-textarea:focus { border-color: var(--blue); }
.action-form-btns { display: flex; gap: 0.5rem; }
.btn-cancel { padding: 0.5rem 0.875rem; border: 1px solid var(--border-2); border-radius: var(--r-md); font-size: 0.8125rem; font-weight: 500; color: var(--text-500); background: transparent; cursor: pointer; }
.btn-cancel:hover { background: var(--surface-2); }
.close-warn { font-size: 0.75rem; color: #dc2626; }

/* audit trail */
.audit-trail { display: flex; flex-direction: column; gap: 0; }
.audit-entry { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid var(--border); }
.audit-entry:last-child { border-bottom: none; }
.audit-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 0.375rem; }
.audit-body { flex: 1; }
.audit-status { font-size: 0.75rem; font-weight: 700; font-family: var(--mono); }
.audit-note   { font-size: 0.75rem; color: var(--text-500); margin-top: 0.2rem; line-height: 1.4; }
.audit-time   { font-size: 0.6875rem; color: var(--text-400); font-family: var(--mono); white-space: nowrap; flex-shrink: 0; margin-top: 0.25rem; }
.locked-notice { display: flex; align-items: center; gap: 0.5rem; padding: 0.875rem; background: #f8fafc; border: 1px solid var(--border); border-radius: var(--r-md); font-size: 0.8125rem; color: var(--text-500); }

/* ── Spinner ──────────────────────────────────────────────────────── */
.spinner { width: 20px; height: 20px; border: 2px solid var(--border); border-top-color: var(--blue); border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to{transform:rotate(360deg)} }
.loading-state { display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 3rem; color: var(--text-500); font-size: 0.875rem; }
.empty-state { text-align: center; padding: 3rem; color: var(--text-400); font-size: 0.875rem; }
`;

// ─── State machine ─────────────────────────────────────────────────
const ALLOWED_TRANSITIONS = {
    open: ["in_progress", "escalated"],
    in_progress: ["resolved", "escalated"],
    escalated: ["in_progress", "resolved"],
    resolved: ["closed"],
    closed: [],
};
const TRANSITION_LABELS = {
    in_progress: "Mark In Progress", escalated: "Escalate",
    resolved: "Mark Resolved", closed: "Close Complaint",
};
const TRANSITION_PLACEHOLDERS = {
    in_progress: "e.g. Team dispatched, ETA 20 mins…",
    escalated: "e.g. Escalating to Commissioner — SLA breached by 2h…",
    resolved: "e.g. Issue fixed, site inspected, citizen confirmed…",
    closed: "Closing note — permanent. Describe the final outcome clearly…",
};

// ─── Helpers ───────────────────────────────────────────────────────
const DEPT_ICONS = { fire: "🔥", water: "💧", roads: "🛣️", sanitation: "🗑️", electricity: "⚡", health: "🏥" };
const getDeptKey = (d = "") => d.toLowerCase().replace(/[\s\/]/g, "_").split("_")[0];
const getDeptIcon = (d) => DEPT_ICONS[getDeptKey(d)] || "🏛️";

const DEPT_SLA = {
    fire: { label: "Fire Services Act 2006", sla: 15, color: "#dc2626" },
    water: { label: "Water Supply Act 1914", sla: 240, color: "#2563eb" },
    sanitation: { label: "Sanitation Act 2000", sla: 360, color: "#7c3aed" },
    roads: { label: "PWD Guidelines 2018", sla: 720, color: "#d97706" },
    electricity: { label: "Electricity Act 2003", sla: 120, color: "#f59e0b" },
    health: { label: "Public Health Act 1948", sla: 180, color: "#059669" },
};
const getDeptPolicy = (d) => DEPT_SLA[getDeptKey(d)] || { label: "Municipal Act 1949", sla: 480, color: "#64748b" };

const DEPT_COLORS = { fire: "#ef4444", "Fire": "#ef4444", water: "#3b82f6", "Water Supply": "#3b82f6", roads: "#f59e0b", "Roads / PWD": "#f59e0b", sanitation: "#8b5cf6", "Sanitation": "#8b5cf6", electricity: "#f97316", "Electricity": "#f97316", health: "#10b981", "Health": "#10b981" };
const getDeptColor = (d) => DEPT_COLORS[d] || DEPT_COLORS[getDeptKey(d)] || "#64748b";

const PRIORITY_W = { urgent: 40, high: 25, medium: 15, low: 5 };
const STATUS_W = { open: 20, escalated: 30, in_progress: 10, resolved: 0, closed: 0 };
const computeAI = (c) => {
    const ageH = (Date.now() - new Date(c.created_at).getTime()) / 3_600_000;
    return Math.min(Math.round((PRIORITY_W[c.urgency] || 10) + (STATUS_W[c.status] || 0) + Math.min(ageH * 1.5, 30)), 99);
};

const getSLA = (c) => {
    const p = getDeptPolicy(c.responsible_department);
    const ageMin = (Date.now() - new Date(c.created_at).getTime()) / 60_000;
    const rem = p.sla - ageMin;
    const fmt = (m) => m >= 60 ? `${Math.floor(m / 60)}h ${Math.round(m % 60)}m` : `${Math.round(m)}m`;
    if (rem < 0) return { type: "breached", label: `SLA: BREACHED ${fmt(Math.abs(rem))} ago` };
    if (rem < p.sla * 0.2) return { type: "warning", label: `${fmt(rem)} left` };
    return { type: "ok", label: `${fmt(rem)} left` };
};

const ESC_LEVELS = { 1: "Dept. Head", 2: "Commissioner", 3: "Chief Secretary" };
const getEscLevel = (c) => {
    const ageH = (Date.now() - new Date(c.created_at).getTime()) / 3_600_000;
    if (c.status === "escalated" && ageH > 6) return 3;
    if (c.status === "escalated") return 2;
    return 1;
};

const SENTIMENTS = ["angry", "frustrated", "neutral", "concerned", "satisfied"];
const SENT_COLORS = { angry: "#dc2626", frustrated: "#ea580c", neutral: "#64748b", concerned: "#d97706", satisfied: "#059669" };
const getSentiment = (c) => SENTIMENTS[Math.abs((c.id || "a").charCodeAt(0) - 97) % SENTIMENTS.length];

const fmtDate = (s) => {
    if (!s) return "N/A";
    try { const d = new Date(s); return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
    catch { return s; }
};
const fmtRel = (ts) => {
    const s = (Date.now() - ts) / 1000;
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.round(s / 60)}m ago`;
    return `${Math.round(s / 3600)}h ago`;
};

const URGENCY_ACCENT = { urgent: "#dc2626", high: "#ea580c", medium: "#2563eb", low: "#059669" };

// ─── Agents ────────────────────────────────────────────────────────
const AGENTS = [
    { abbr: "ES", name: "EscalationAgent", color: "#dc2626" },
    { abbr: "SA", name: "SentimentAgent", color: "#f97316" },
    { abbr: "PI", name: "PolicyAgent", color: "#7c3aed" },
    { abbr: "CL", name: "ClassificationAgent", color: "#2563eb" },
    { abbr: "FU", name: "FollowUpAgent", color: "#059669" },
    { abbr: "NT", name: "NotifyAgent", color: "#0891b2" },
    { abbr: "AU", name: "AuditAgent", color: "#64748b" },
    { abbr: "RT", name: "RoutingAgent", color: "#d97706" },
];

const buildFeed = (complaints) => {
    if (!complaints.length) return [];
    const now = Date.now();
    const events = [];
    complaints.slice(0, 5).forEach((c, i) => {
        const sla = getSLA(c);
        const pol = getDeptPolicy(c.responsible_department);
        const ai = computeAI(c);
        const polSla = pol.sla < 60 ? `${pol.sla}m` : `${pol.sla / 60}h`;
        events.push({ agent: AGENTS[0], text: `#${c.id.substring(0, 8)} escalated to ${ESC_LEVELS[getEscLevel(c)]}. ${sla.type === "breached" ? sla.label : ""}`, score: null, ts: now - i * 80_000 - 10_000 });
        events.push({ agent: AGENTS[1], text: "3 new complaints flagged as angry. Urgency boosted on 2.", score: null, ts: now - i * 120_000 - 25_000 });
        events.push({ agent: AGENTS[2], text: `#${c.id.substring(0, 8)} mapped to ${pol.label}. Legal SLA: ${polSla}.`, score: null, ts: now - i * 100_000 - 40_000 });
        events.push({ agent: AGENTS[3], text: "5 new complaints classified, 2 routed to PMC, 1 to BMC Fire Dept.", score: ai, ts: now - i * 90_000 - 60_000 });
        events.push({ agent: AGENTS[4], text: "4 stale complaints (>2 days) auto-pinged to department heads.", score: null, ts: now - i * 150_000 - 80_000 });
    });
    return events.sort((a, b) => b.ts - a.ts).slice(0, 10);
};




// ─── Shared StatusChip ─────────────────────────────────────────────
const StatusChip = ({ status }) => (
    <span className={`chip chip--${status}`}>{status?.replace("_", " ").toUpperCase()}</span>
);
const UrgencyChip = ({ urgency }) => (
    <span className={`chip chip--${urgency}`}>{urgency?.toUpperCase()}</span>
);
const SlaChip = ({ complaint }) => {
    const sla = getSLA(complaint);
    if (complaint.status === "closed" || complaint.status === "resolved") return null;
    return <span className={`sla-chip sla-chip--${sla.type}`}><Clock size={9} />{sla.label}</span>;
};

// ─── Audit dot color ───────────────────────────────────────────────
const auditDotColor = (s) => ({
    resolved: "#059669", escalated: "#dc2626", in_progress: "#d97706", closed: "#64748b", open: "#2563eb"
}[s] || "#94a3b8");

// ══════════════════════════════════════════════════════════════════
// COMPLAINT DETAIL PANEL
// ══════════════════════════════════════════════════════════════════
const ComplaintDetail = ({ complaint, onClose, onStatusChange }) => {
    const [activeAction, setActiveAction] = useState(null); // which transition is selected
    const [note, setNote] = useState("");
    const [confirmClose, setConfirmClose] = useState(false);
    const [saving, setSaving] = useState(false);

    if (!complaint) return null;

    const allowed = ALLOWED_TRANSITIONS[complaint.status] || [];
    const isClosed = complaint.status === "closed";
    const notes = complaint.agent_metadata?.admin_notes || [];
    const pol = getDeptPolicy(complaint.responsible_department);
    const sla = getSLA(complaint);
    const lvl = complaint.status === "escalated" ? getEscLevel(complaint) : null;

    const pick = (ts) => { setActiveAction(ts); setNote(""); setConfirmClose(false); };
    const cancel = () => { setActiveAction(null); setNote(""); setConfirmClose(false); };

    const confirm = async () => {
        if (!note.trim()) return;
        setSaving(true);
        await axios.patch(
            `${API_URL}/api/admin/complaints/${complaint.id}/status`,
            null,
            { params: { new_status: activeAction, notes: note.trim() } }
        )
        onStatusChange(complaint.id, activeAction, note.trim());
        setSaving(false);
        cancel();
    };

    const ACTN_CLS = { in_progress: "btn-act--prog", escalated: "btn-act--esc", resolved: "btn-act--res", closed: "btn-act--close" };

    return (
        <div className="detail-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="detail-panel">
                {/* topbar */}
                <div className="detail-topbar">
                    <button className="detail-back" onClick={onClose}><ArrowLeft size={14} />All Complaints</button>
                    <button className="detail-close" onClick={onClose}><X size={14} /></button>
                </div>

                <div className="detail-body">
                    {/* header */}
                    <div className="detail-header">
                        <div className="detail-id">#{complaint.id.substring(0, 8)}</div>
                        <div className="detail-title">{complaint.description}</div>
                        <div className="detail-chips">
                            <StatusChip status={complaint.status} />
                            <UrgencyChip urgency={complaint.urgency} />
                            <SlaChip complaint={complaint} />
                            {lvl && <span className={`esc-level-badge esc-l${lvl}`}>L{lvl} — {ESC_LEVELS[lvl]}</span>}
                        </div>
                    </div>

                    {/* meta grid */}
                    <div>
                        <div className="detail-section-title" style={{ marginBottom: "0.625rem" }}>Details</div>
                        <div className="detail-meta-grid">
                            <div className="detail-meta-item">
                                <div className="detail-meta-key"><Building2 size={10} style={{ display: "inline", marginRight: 3 }} />Department</div>
                                <div className="detail-meta-val">{getDeptIcon(complaint.responsible_department)} {complaint.responsible_department || "N/A"}</div>
                            </div>
                            <div className="detail-meta-item">
                                <div className="detail-meta-key"><Calendar size={10} style={{ display: "inline", marginRight: 3 }} />Filed</div>
                                <div className="detail-meta-val" style={{ fontSize: "0.8125rem" }}>{fmtDate(complaint.created_at)}</div>
                            </div>
                            <div className="detail-meta-item">
                                <div className="detail-meta-key"><Scale size={10} style={{ display: "inline", marginRight: 3 }} />Governing Law</div>
                                <div className="detail-meta-val" style={{ fontSize: "0.75rem" }}>{pol.label}</div>
                            </div>
                            <div className="detail-meta-item">
                                <div className="detail-meta-key"><Clock size={10} style={{ display: "inline", marginRight: 3 }} />Legal SLA</div>
                                <div className="detail-meta-val">{pol.sla < 60 ? `${pol.sla}m` : `${pol.sla / 60}h`}</div>
                            </div>
                            {complaint.location && (
                                <div className="detail-meta-item" style={{ gridColumn: "span 2" }}>
                                    <div className="detail-meta-key"><MapPin size={10} style={{ display: "inline", marginRight: 3 }} />Location</div>
                                    <div className="detail-meta-val">
                                        {typeof complaint.location === "object" && complaint.location !== null
                                            ? [
                                                complaint.location.address,
                                                complaint.location.city,
                                                complaint.location.district,
                                                complaint.location.state,
                                                complaint.location.pincode,
                                                complaint.location.country,
                                            ]
                                                .filter(Boolean)
                                                .join(", ")
                                            : complaint.location || "N/A"}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* description */}
                    <div>
                        <div className="detail-section-title" style={{ marginBottom: "0.625rem" }}>Complaint Description</div>
                        <div className="detail-desc">{complaint.description || "No description provided."}</div>
                    </div>

                    {/* actions */}
                    <div>
                        <div className="detail-section-title" style={{ marginBottom: "0.625rem" }}>Actions</div>
                        {isClosed ? (
                            <div className="locked-notice"><Lock size={14} />Permanently closed — no further changes allowed.</div>
                        ) : (
                            <>
                                {!activeAction && (
                                    <div className="detail-actions">
                                        {allowed.length === 0 ? (
                                            <span style={{ fontSize: "0.8125rem", color: "var(--text-400)" }}>No transitions available.</span>
                                        ) : allowed.map(ts => (
                                            <button key={ts} className={`btn-act ${ACTN_CLS[ts]}`} onClick={() => pick(ts)}>
                                                {TRANSITION_LABELS[ts]} <ChevronRight size={13} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {activeAction && (
                                    <div className="action-form">
                                        <div className="detail-actions" style={{ marginBottom: "0.25rem" }}>
                                            {allowed.map(ts => (
                                                <button key={ts} className={`btn-act ${ACTN_CLS[ts]}${activeAction === ts ? " btn-act--primary" : ""}`}
                                                    style={activeAction === ts ? { borderColor: "var(--blue)", background: "var(--blue)", color: "#fff" } : {}}
                                                    onClick={() => pick(ts)}>
                                                    {TRANSITION_LABELS[ts]}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="action-form-label">
                                            {activeAction === "closed" ? "Closing note — required & permanent" : "Reason for status change (required)"}
                                        </div>
                                        <textarea className="action-textarea" rows={3}
                                            placeholder={TRANSITION_PLACEHOLDERS[activeAction]}
                                            value={note} onChange={e => setNote(e.target.value)}
                                            disabled={saving} />
                                        <div className="action-form-btns">
                                            {activeAction === "closed" ? (
                                                confirmClose ? (
                                                    <>
                                                        <button className="btn-act btn-act--esc" disabled={!note.trim() || saving} onClick={confirm}>
                                                            {saving ? "Closing…" : "Confirm — Permanently Close"}
                                                        </button>
                                                        <button className="btn-cancel" onClick={cancel}>Cancel</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button className="btn-act btn-act--close" disabled={!note.trim()} onClick={() => setConfirmClose(true)}>
                                                            Close Complaint →
                                                        </button>
                                                        <button className="btn-cancel" onClick={cancel}>Cancel</button>
                                                    </>
                                                )
                                            ) : (
                                                <>
                                                    <button className="btn-act btn-act--primary" disabled={!note.trim() || saving} onClick={confirm}>
                                                        {saving ? "Saving…" : "Confirm Change"}
                                                    </button>
                                                    <button className="btn-cancel" onClick={cancel} disabled={saving}>Cancel</button>
                                                </>
                                            )}
                                        </div>
                                        {activeAction === "closed" && <p className="close-warn">⚠ This action cannot be undone. Complaint will be permanently locked.</p>}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* audit trail */}
                    {notes.length > 0 && (
                        <div>
                            <div className="detail-section-title" style={{ marginBottom: "0.625rem" }}>Audit Trail</div>
                            <div className="audit-trail">
                                {[...notes].reverse().map((n, i) => (
                                    <div key={i} className="audit-entry">
                                        <div className="audit-dot" style={{ background: auditDotColor(n.status) }} />
                                        <div className="audit-body">
                                            <div className="audit-status" style={{ color: auditDotColor(n.status) }}>
                                                Status → {n.status?.toUpperCase()}
                                            </div>
                                            {n.note && <div className="audit-note">{n.note}</div>}
                                        </div>
                                        <div className="audit-time">
                                            {n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ══════════════════════════════════════════════════════════════════
const DashboardPage = ({ metrics, complaints, agentFeed, loading, onNavigateComplaints, onViewComplaint }) => {
    const sorted = useMemo(() => [...complaints].sort((a, b) => computeAI(b) - computeAI(a)), [complaints]);
    const escalated = sorted.filter(c => c.status === "escalated");
    const maxDept = metrics?.by_department ? Math.max(...Object.values(metrics.by_department), 1) : 1;
    const urgentCount = sorted.filter(c => c.urgency === "urgent" && c.status !== "closed").length;

    const kpis = metrics ? [
        { label: "Total Complaints", val: metrics.total_complaints, icon: <BarChart3 size={18} />, accent: "#2563eb", iconBg: "#eff6ff", numColor: "#0f172a", sub: "all time" },
        { label: "Open", val: metrics.by_status?.open || 0, icon: <TrendingUp size={18} />, accent: "#06b6d4", iconBg: "#ecfeff", numColor: "#0f172a", sub: "awaiting action" },
        { label: "In Progress", val: metrics.by_status?.in_progress || 0, icon: <Clock size={18} />, accent: "#d97706", iconBg: "#fffbeb", numColor: "#0f172a", sub: "being handled" },
        { label: "Resolved", val: metrics.by_status?.resolved || 0, icon: <CheckCircle2 size={18} />, accent: "#059669", iconBg: "#f0fdf4", numColor: "#059669", sub: "closed successfully" },
        { label: "Escalated", val: metrics.by_status?.escalated || 0, icon: <AlertTriangle size={18} />, accent: "#dc2626", iconBg: "#fef2f2", numColor: "#dc2626", sub: "needs attention", alert: true },
        { label: "SLA Breaches", val: metrics.sla_breaches || 0, icon: <ShieldAlert size={18} />, accent: "#dc2626", iconBg: "#fef2f2", numColor: "#dc2626", sub: "overdue cases", alert: true },
    ] : [];

    const now = new Date();

    return (
        <div className="page">
            {/* page head */}
            <div className="page-head">
                <div className="page-title">Admin Command Center</div>
                <div className="page-meta">
                    <span>Grievance Resolver</span>
                    <span className="page-meta-dot" />
                    <span>Live data · {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="page-meta-dot" />

                </div>
            </div>

            {/* KPI grid */}
            {loading ? (
                <div className="loading-state"><div className="spinner" /><span>Loading metrics…</span></div>
            ) : (
                <div className="kpi-grid">
                    {kpis.map(k => (
                        <div key={k.label} className={`kpi${k.alert && k.val > 0 ? " kpi--alert" : ""}`}
                            style={{ "--kpi-accent": k.accent, "--kpi-icon-bg": k.iconBg, "--kpi-num-color": k.numColor }}>
                            <div className="kpi-icon-wrap" style={{ background: k.iconBg }}>
                                <span style={{ color: k.accent }}>{k.icon}</span>
                            </div>
                            <div className="kpi-num">{k.val}</div>
                            <div className="kpi-label">{k.label}</div>
                            <div className="kpi-sub">{k.sub}</div>
                            <div className="kpi-accent-bar" />
                        </div>
                    ))}
                </div>
            )}

            {/* 2-col intel */}
            <div className="intel-grid">
                {/* Live Complaints */}
                <div className="panel">
                    <div className="panel-hd">
                        <div className="panel-hd-l">
                            <Zap size={13} color="#2563eb" />
                            <span className="panel-title">Live Complaints</span>
                            <span className="pbadge pbadge--red">{urgentCount} urgent</span>
                            <span className="pbadge pbadge--blue">AI ranked</span>
                        </div>
                    </div>
                    <div className="panel-body">
                        {sorted.slice(0, 5).map(c => {
                            const ai = computeAI(c);
                            const sla = getSLA(c);
                            return (
                                <div key={c.id} className="cfi" onClick={() => onViewComplaint(c)} style={{ cursor: "pointer" }}>
                                    <div className="cfi-top">
                                        <div className="cfi-title">{c.description?.substring(0, 65)}…</div>
                                        <span className="cfi-id">{c.id.substring(0, 8)}</span>
                                    </div>
                                    <div className="cfi-chips">
                                        <StatusChip status={c.status} />
                                        <UrgencyChip urgency={c.urgency} />
                                        <SlaChip complaint={c} />
                                    </div>
                                    <div className="cfi-meta">
                                        <span>{getDeptIcon(c.responsible_department)} {c.responsible_department}</span>
                                        <span className="score-pill">AI·{ai}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="panel-footer">
                        <button className="view-more-btn" onClick={onNavigateComplaints}>
                            View all complaints <ChevronRight size={12} />
                        </button>
                    </div>
                </div>

                {/* Agent Feed */}
                <div className="panel">
                    <div className="panel-hd">
                        <div className="panel-hd-l">
                            <Brain size={13} color="#7c3aed" />
                            <span className="panel-title">Agent Activity Feed</span>
                            <span className="pbadge pbadge--green"><div className="live-dot" style={{ width: 5, height: 5 }} />Live</span>
                        </div>
                    </div>
                    <div className="panel-body">
                        {agentFeed.slice(0, 5).map((ev, i) => (
                            <div key={i} className="agent-row">
                                <div className="agent-avatar" style={{ background: ev.agent.color }}>{ev.agent.abbr}</div>
                                <div className="agent-body">
                                    <div className="agent-name">{ev.agent.name}</div>
                                    <div className="agent-desc">{ev.text}</div>
                                </div>
                                <div className="agent-time">{fmtRel(ev.ts)}</div>
                            </div>
                        ))}
                    </div>
                    <div className="panel-footer">
                        <button className="view-more-btn">
                            View full log <ChevronRight size={12} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 3-col bottom */}
            <div className="bottom-grid">
                {/* Dept Load */}
                <div className="panel">
                    <div className="panel-hd">
                        <div className="panel-hd-l">
                            <Activity size={13} color="#059669" />
                            <span className="panel-title">Department Load</span>
                        </div>
                    </div>
                    <div className="panel-body">
                        {metrics?.by_department && Object.entries(metrics.by_department).sort(([, a], [, b]) => b - a).map(([dept, count]) => {
                            const breached = Math.floor(count * 0.2);
                            return (
                                <div key={dept} className="dept-row">
                                    <div className="dept-icon">{getDeptIcon(dept)}</div>
                                    <div className="dept-col">
                                        <div className="dept-name">{dept}</div>
                                        <div className="dept-bar-bg"><div className="dept-bar-fill" style={{ width: `${(count / maxDept) * 100}%`, background: getDeptColor(dept) }} /></div>
                                        <div className="dept-sub">{count} open{breached > 0 && <> · <span className="breach">{breached} breached</span></>}</div>
                                    </div>
                                    <div className="dept-count">{count}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Escalation Tracker */}
                <div className="panel">
                    <div className="panel-hd">
                        <div className="panel-hd-l">
                            <AlertTriangle size={13} color="#dc2626" />
                            <span className="panel-title">Escalation Tracker</span>
                            <span className="pbadge pbadge--red">{escalated.length} active</span>
                        </div>
                    </div>
                    <div className="panel-body">
                        {escalated.length === 0 ? (
                            <div className="empty-state">No active escalations 🎉</div>
                        ) : escalated.map(c => {
                            const lvl = getEscLevel(c);
                            const sla = getSLA(c);
                            return (
                                <div key={c.id} className="esc-row" onClick={() => onViewComplaint(c)} style={{ cursor: "pointer" }}>
                                    <div>
                                        <div className="esc-title">{c.description?.substring(0, 50)}…</div>
                                        <div className="esc-sub">{c.id.substring(0, 8)} · {c.responsible_department} · <span className="esc-red">{sla.label}</span></div>
                                    </div>
                                    <span className={`esc-level-badge esc-l${lvl}`}>L{lvl} — {ESC_LEVELS[lvl]}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Quick stats */}
                <div className="panel">
                    <div className="panel-hd">
                        <div className="panel-hd-l">
                            <BarChart3 size={13} color="#2563eb" />
                            <span className="panel-title">Status Distribution</span>
                        </div>
                    </div>
                    <div className="panel-body" style={{ padding: "1rem 1.125rem" }}>
                        {metrics && Object.entries(metrics.by_status).map(([status, count]) => (
                            <div key={status} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border)" }}>
                                <StatusChip status={status} />
                                <span style={{ fontFamily: "var(--mono)", fontSize: "0.875rem", fontWeight: 700, color: "var(--text-900)" }}>{count}</span>
                            </div>
                        ))}
                        {metrics && (
                            <div style={{ marginTop: "0.875rem", fontSize: "0.75rem", color: "var(--text-400)" }}>
                                Resolution rate: <strong style={{ color: "var(--text-700)" }}>{metrics.by_status?.resolved ? Math.round((metrics.by_status.resolved / metrics.total_complaints) * 100) : 0}%</strong>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════
// COMPLAINTS PAGE
// ══════════════════════════════════════════════════════════════════
const STATUS_TABS = ["all", "open", "in_progress", "escalated", "resolved", "closed"];
const TAB_LABELS = { all: "All", open: "Open", in_progress: "In Progress", escalated: "Escalated", resolved: "Resolved", closed: "Closed" };

const ComplaintsPage = ({ complaints, loading, onViewComplaint }) => {
    const [search, setSearch] = useState("");
    const [statusTab, setStatusTab] = useState("all");
    const [deptFilter, setDeptFilter] = useState("all");

    const depts = useMemo(() => [...new Set(complaints.map(c => c.responsible_department).filter(Boolean))], [complaints]);
    const sorted = useMemo(() => [...complaints].sort((a, b) => computeAI(b) - computeAI(a)), [complaints]);

    const filtered = useMemo(() => sorted.filter(c => {
        if (statusTab !== "all" && c.status !== statusTab) return false;
        if (deptFilter !== "all" && c.responsible_department !== deptFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            return (c.description || "").toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || (c.responsible_department || "").toLowerCase().includes(q);
        }
        return true;
    }), [sorted, statusTab, deptFilter, search]);

    return (
        <div className="page">
            <div className="page-head">
                <div className="page-title">Complaints</div>
                <div className="page-meta">
                    <span>Showing {filtered.length} of {complaints.length}</span>
                    <span className="page-meta-dot" />
                    <span>AI priority ranked</span>
                </div>
            </div>

            {/* toolbar */}
            <div className="complaints-bar">
                <div className="search-wrap">
                    <Search size={14} color="var(--text-400)" />
                    <input className="search-input" placeholder="Search ID, description, department…"
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="filter-chips">
                    {STATUS_TABS.map(s => (
                        <button key={s} className={`fchip${statusTab === s ? " active" : ""}`} onClick={() => setStatusTab(s)}>
                            {TAB_LABELS[s]}
                        </button>
                    ))}
                </div>
                <div className="filter-sel-wrap">
                    <select className="filter-sel" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                        <option value="all">All Departments</option>
                        {depts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading-state"><div className="spinner" /><span>Loading complaints…</span></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">No complaints found matching your filters.</div>
            ) : (
                <div className="complaint-list">
                    {filtered.map(c => {
                        const sla = getSLA(c);
                        const pol = getDeptPolicy(c.responsible_department);
                        return (
                            <div key={c.id} className="cl-item" style={{ "--cl-accent": URGENCY_ACCENT[c.urgency] || "var(--border)" }}>
                                <div className="cl-main">
                                    <div className="cl-id">#{c.id.substring(0, 8)}</div>
                                    <div className="cl-title" title={c.description}>{c.description}</div>
                                    <div className="cl-chips">
                                        <StatusChip status={c.status} />
                                        <UrgencyChip urgency={c.urgency} />
                                        {c.status !== "closed" && c.status !== "resolved" && (
                                            <span className={`sla-chip sla-chip--${sla.type}`}><Clock size={9} />{sla.label}</span>
                                        )}
                                        <span style={{ fontSize: "0.6875rem", color: "var(--text-400)", fontFamily: "var(--mono)" }}>{pol.label}</span>
                                    </div>
                                    <div className="cl-meta">
                                        <span className="cl-meta-item"><Building2 size={10} />{c.responsible_department || "N/A"}</span>
                                        <span className="cl-meta-item"><Calendar size={10} />{fmtDate(c.created_at)}</span>
                                        {c.status === "escalated" && <span className="cl-meta-item" style={{ color: "#dc2626" }}>
                                            <AlertTriangle size={10} />L{getEscLevel(c)} — {ESC_LEVELS[getEscLevel(c)]}
                                        </span>}
                                    </div>
                                </div>
                                <div className="cl-action">
                                    <button className="btn-view" onClick={() => onViewComplaint(c)}>
                                        View <ChevronRight size={13} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════
// ROOT SHELL
// ══════════════════════════════════════════════════════════════════
const GrievanceAdminShell = ({ defaultPage = "dashboard" }) => {
    // ── State ───────────────────────────────────────────────────────
    const [page, setPage] = useState(defaultPage);
    useEffect(() => {
        setPage(defaultPage);
    }, [defaultPage]); // "dashboard" | "complaints"
    const [metrics, setMetrics] = useState(null);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detailComplaint, setDetail] = useState(null);
    const [agentFeed, setAgentFeed] = useState([]);
    const [lastRefresh, setLastRefresh] = useState(Date.now());

    // ── Fetch (swap with real axios) ────────────────────────────────
    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [mRes, cRes] = await Promise.all([
                axios.get(`${API_URL}/api/admin/dashboard`),
                axios.get(`${API_URL}/api/admin/complaints`),
            ])
            setMetrics(mRes.data.metrics)
            setComplaints(cRes.data.complaints || [])
            setLastRefresh(Date.now())
            setMetrics(MOCK_METRICS);
            setComplaints(MOCK_COMPLAINTS);
            setLastRefresh(Date.now());
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);
    useEffect(() => { setAgentFeed(buildFeed(complaints)); }, [complaints]);

    // ── Status change (from detail panel) ───────────────────────────
    const handleStatusChange = useCallback((id, newStatus, note) => {
        setComplaints(prev => prev.map(c => {
            if (c.id !== id) return c;
            const existingNotes = c.agent_metadata?.admin_notes || [];
            return {
                ...c,
                status: newStatus,
                agent_metadata: {
                    ...c.agent_metadata,
                    admin_notes: [...existingNotes, { status: newStatus, note, timestamp: new Date().toISOString() }],
                },
            };
        }));
        // Reflect in detail panel
        setDetail(prev => {
            if (!prev || prev.id !== id) return prev;
            const existingNotes = prev.agent_metadata?.admin_notes || [];
            return {
                ...prev,
                status: newStatus,
                agent_metadata: {
                    ...prev.agent_metadata,
                    admin_notes: [...existingNotes, { status: newStatus, note, timestamp: new Date().toISOString() }],
                },
            };
        });
    }, []);

    // ── Nav ──────────────────────────────────────────────────────────
    const NAV = [
        { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={14} /> },
        { key: "complaints", label: "Complaints", icon: <FileText size={14} /> },
    ];

    const agentsLive = 8;

    return (
        <>
            <style>{css}</style>
            <div className="adm">
                {/* ── Topbar ───────────────────────────────────────────── */}


                {/* ── Body ─────────────────────────────────────────────── */}
                <div className="adm-body">
                    <main className="adm-content">
                        {page === "dashboard" && (
                            <DashboardPage
                                metrics={metrics}
                                complaints={complaints}
                                agentFeed={agentFeed}
                                loading={loading}
                                onNavigateComplaints={() => setPage("complaints")}
                                onViewComplaint={c => setDetail(c)}
                            />
                        )}
                        {page === "complaints" && (
                            <ComplaintsPage
                                complaints={complaints}
                                loading={loading}
                                onViewComplaint={c => setDetail(c)}
                            />
                        )}
                    </main>
                </div>

                {/* ── Detail panel overlay ──────────────────────────────── */}
                {detailComplaint && (
                    <ComplaintDetail
                        complaint={detailComplaint}
                        onClose={() => setDetail(null)}
                        onStatusChange={handleStatusChange}
                    />
                )}
            </div>
        </>
    );
};

export default GrievanceAdminShell;