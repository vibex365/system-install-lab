import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, Globe, Star, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Lead {
  id: string;
  business_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  city: string | null;
  address: string | null;
  category: string | null;
  pipeline_status: string;
  source: string;
  notes: string | null;
  audit_summary: string | null;
  rating: number | null;
  website_quality_score: number | null;
  created_at: string;
}

interface NicheOption {
  id: string;
  display_name: string;
  pipeline_stages: string[];
}

interface KanbanBoardProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onStatusChange: (id: string, status: string) => void;
}

const STAGE_COLORS = [
  "border-t-blue-500/60",
  "border-t-violet-500/60",
  "border-t-amber-500/60",
  "border-t-emerald-500/60",
  "border-t-cyan-500/60",
  "border-t-pink-500/60",
  "border-t-orange-500/60",
  "border-t-lime-500/60",
  "border-t-rose-500/60",
  "border-t-indigo-500/60",
];

export function KanbanBoard({ leads, onLeadClick, onStatusChange }: KanbanBoardProps) {
  const [niches, setNiches] = useState<NicheOption[]>([]);
  const [selectedNiche, setSelectedNiche] = useState<string>("");
  const [draggedLead, setDraggedLead] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("niche_config")
        .select("id, display_name, pipeline_stages");
      if (data && data.length > 0) {
        setNiches(data as NicheOption[]);
        setSelectedNiche(data[0].id);
      }
    })();
  }, []);

  const stages = useMemo(() => {
    const niche = niches.find((n) => n.id === selectedNiche);
    return niche?.pipeline_stages || [];
  }, [niches, selectedNiche]);

  const columns = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const stage of stages) {
      map[stage] = [];
    }
    // "Other" bucket for leads not in any niche stage
    map["__other"] = [];
    for (const lead of leads) {
      if (stages.includes(lead.pipeline_status)) {
        map[lead.pipeline_status].push(lead);
      } else {
        map["__other"].push(lead);
      }
    }
    return map;
  }, [leads, stages]);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLead(leadId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    if (draggedLead) {
      onStatusChange(draggedLead, stage);
      setDraggedLead(null);
    }
  };

  if (niches.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        No niche configurations found. Add niches to enable the Kanban view.
      </div>
    );
  }

  const allStages = [...stages, ...(columns["__other"]?.length > 0 ? ["__other"] : [])];

  return (
    <div className="space-y-4">
      {/* Niche selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-muted-foreground">Pipeline:</span>
        <div className="flex gap-1.5 flex-wrap">
          {niches.map((n) => (
            <button
              key={n.id}
              onClick={() => setSelectedNiche(n.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                selectedNiche === n.id
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "bg-transparent text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {n.display_name}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban columns */}
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-4" style={{ minWidth: `${allStages.length * 260}px` }}>
          {allStages.map((stage, idx) => {
            const stageLeads = columns[stage] || [];
            const colorClass = stage === "__other" ? "border-t-muted-foreground/40" : STAGE_COLORS[idx % STAGE_COLORS.length];
            const label = stage === "__other" ? "Other" : stage.replace(/_/g, " ");

            return (
              <div
                key={stage}
                className={`flex-shrink-0 w-[250px] rounded-lg bg-muted/30 border border-border ${colorClass} border-t-2`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
              >
                {/* Column header */}
                <div className="px-3 py-2.5 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-foreground capitalize">{label}</h3>
                  <Badge variant="outline" className="text-[10px] h-5 min-w-[20px] justify-center">
                    {stageLeads.length}
                  </Badge>
                </div>

                {/* Cards */}
                <div className="px-2 pb-2 space-y-2 max-h-[60vh] overflow-y-auto scrollbar-hide">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onClick={() => onLeadClick(lead)}
                      className={`group rounded-md border border-border bg-card p-3 cursor-pointer hover:border-primary/40 transition-all ${
                        draggedLead === lead.id ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs font-semibold text-foreground truncate">{lead.business_name}</p>
                        <GripVertical className="h-3 w-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                      </div>
                      {lead.city && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{lead.city}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {lead.phone && <Phone className="h-3 w-3 text-muted-foreground/60" />}
                        {lead.email && <Mail className="h-3 w-3 text-muted-foreground/60" />}
                        {lead.website && <Globe className="h-3 w-3 text-muted-foreground/60" />}
                        {lead.rating != null && (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-400 ml-auto">
                            <Star className="h-2.5 w-2.5 fill-amber-400" />
                            {lead.rating}
                          </span>
                        )}
                      </div>
                      {lead.category && (
                        <Badge variant="outline" className="text-[9px] mt-2 h-4">
                          {lead.category}
                        </Badge>
                      )}
                    </div>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="py-8 text-center">
                      <p className="text-[10px] text-muted-foreground/50">Drop leads here</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
