import React, { useState } from 'react';
import {
  FolderArchive,
  Clock,
  AlertTriangle,
  FileCheck2,
  TrendingUp,
  Layers,
  Sparkles
} from 'lucide-react';
import { StatCard } from './StatCard';
import { QuickActions } from './QuickActions';
import { DashboardCharts } from './DashboardCharts';
import { RecentActivity } from './RecentActivity';
import { FDRTable } from './FDRTable';
import { PrioritizedActionQueue } from './PrioritizedActionQueue';
import { calculateFdrSummary, formatINR } from '../data/sampleFdrData';

export function Dashboard({
  records,
  onViewDetails,
  onActionSelect,
  onNavigateToAudit,
  searchTerm = ""
}) {
  // Dynamically calculate summary stats from local sample data
  const summary = calculateFdrSummary(records);

  // Selected filter state linked from clicking StatCards
  const [activeTableFilter, setActiveTableFilter] = useState("All");

  const handleCardClick = (filterName) => {
    setActiveTableFilter(filterName);
    // Smooth scroll down to table
    const tableElem = document.getElementById("fdr-cases-table");
    if (tableElem) {
      tableElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Bureau Security Advisory */}
      <div className="p-4 rounded-xl skeuo-panel border-l-4 border-l-accent-orange flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start md:items-center gap-3">
          <span className="led-indicator led-green mt-1 md:mt-0 flex-shrink-0" />
          <div>
            <h2 className="text-xs font-mono font-bold uppercase text-text-primary flex items-center gap-2">
              <span>Regulation Bureau Fixed Deposit Monitor</span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] bg-accent-orange/15 text-accent-orange">
                AICTE ACTIVE MANDATE
              </span>
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Live tracking of institutional security deposits pledged under Regulation Bureau lien. Fictional demo environment.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono flex-shrink-0">
          <span className="px-2.5 py-1 rounded-lg skeuo-recessed text-text-muted">
            Vault Corpus: <strong className="text-text-primary">{formatINR(summary.totalAmount, true)}</strong>
          </span>
        </div>
      </div>

      {/* 4 Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total FDRs */}
        <StatCard
          title="Total FDRs"
          value={summary.total}
          badgeText={formatINR(summary.totalAmount, true)}
          subtext="Active security instruments in vault"
          icon={FolderArchive}
          variant="default"
          isActive={activeTableFilter === "All"}
          onClick={() => handleCardClick("All")}
        />

        {/* Card 2: Expiring Soon */}
        <StatCard
          title="Expiring Soon"
          value={summary.expiringSoon}
          badgeText="< 45 Days"
          subtext="Upcoming maturity milestones"
          icon={Clock}
          variant="warning"
          isActive={activeTableFilter === "Expiring Soon"}
          onClick={() => handleCardClick("Expiring Soon")}
        />

        {/* Card 3: Pending Verification */}
        <StatCard
          title="Pending Verification"
          value={summary.pendingVerification}
          badgeText="In Queue"
          subtext="Awaiting bank confirmation letters"
          icon={FileCheck2}
          variant="pending"
          isActive={activeTableFilter === "Pending"}
          onClick={() => handleCardClick("Pending")}
        />

        {/* Card 4: Overdue Cases */}
        <StatCard
          title="Overdue Cases"
          value={summary.overdueCases}
          badgeText="Action Req."
          subtext="Critical unrenewed deposit lapses"
          icon={AlertTriangle}
          variant="critical"
          isActive={activeTableFilter === "Overdue"}
          onClick={() => handleCardClick("Overdue")}
        />
      </div>

      {/* Quick Actions Panel */}
      <QuickActions onActionSelect={onActionSelect} />

      {/* Analytics & Activity Split Grid */}
      <div className="space-y-6">
        {/* Charts */}
        <DashboardCharts records={records} />

        {/* Recent Activity Live Panel */}
        <RecentActivity records={records} onInspectLog={onNavigateToAudit} />
      </div>

      {/* Statutory Maturity Tracking & Explainable Risk Prioritized Action Queue (Step 6) */}
      <PrioritizedActionQueue
        records={records}
        onViewDetails={onViewDetails}
      />

      {/* Priority Cases Table */}
      <div id="fdr-cases-table">
        <FDRTable
          records={records}
          initialStatusFilter={activeTableFilter}
          key={activeTableFilter} // Re-mount with new filter if changed from statcard
          onViewDetails={onViewDetails}
          externalSearchTerm={searchTerm}
        />
      </div>

    </div>
  );
}
