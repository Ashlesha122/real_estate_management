import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Loader2,
  User,
  ChevronRight,
  Plus,
  X
} from 'lucide-react';
import { LeadStage, ContactMode } from '../../types';
import { formatDate, formatDateTime, getLeadStageColor } from '../../lib/utils';
import api from '../../api/client';
import { toast } from 'sonner';

const STAGES: { stage: LeadStage; title: string; color: string }[] = [
  { stage: LeadStage.NEW, title: 'New Inquiries', color: 'bg-blue-500' },
  { stage: LeadStage.SITE_VISIT_SCHEDULED, title: 'Visits Scheduled', color: 'bg-amber-500' },
  { stage: LeadStage.NEGOTIATION, title: 'In Negotiation', color: 'bg-purple-500' },
  { stage: LeadStage.CLOSED, title: 'Closed / Deal Won', color: 'bg-emerald-500' },
  { stage: LeadStage.DROPPED, title: 'Dropped', color: 'bg-rose-500' },
];

export default function LeadsBoard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leads?limit=100');
      setLeads(res.data.data || []);
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStageChange = async (leadId: string, newStage: LeadStage) => {
    try {
      await api.patch(`/leads/${leadId}`, { stage: newStage });
      toast.success(`Lead moved to ${newStage.replace(/_/g, ' ')}`);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l))
      );
      if (selectedLead?.id === leadId) {
        setSelectedLead((prev: any) => ({ ...prev, stage: newStage }));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid stage transition');
    }
  };

  const openLeadDetails = async (lead: any) => {
    setSelectedLead(lead);
    try {
      const [notesRes, actRes] = await Promise.allSettled([
        api.get(`/leads/${lead.id}/notes`),
        api.get(`/leads/${lead.id}/activities`),
      ]);
      setNotes(notesRes.status === 'fulfilled' ? notesRes.value.data || [] : []);
      setActivities(actRes.status === 'fulfilled' ? actRes.value.data || [] : []);
    } catch {
      // ignore
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedLead) return;
    try {
      setSavingNote(true);
      const res = await api.post(`/leads/${selectedLead.id}/notes`, { body: newNote.trim() });
      setNotes([res.data, ...notes]);
      setNewNote('');
      toast.success('Note added to timeline');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add note');
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-estate-200">
        <div>
          <h1 className="text-2xl font-bold font-display text-estate-900">Leads CRM Pipeline</h1>
          <p className="text-xs text-estate-500 mt-1">
            Track inquiries, update pipeline stages, record activity notes, and schedule visits
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-primary-600">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        /* Kanban Board Columns */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-6">
          {STAGES.map(({ stage, title, color }) => {
            const columnLeads = leads.filter((l) => l.stage === stage);
            return (
              <div
                key={stage}
                className="bg-estate-50/80 rounded-2xl p-4 border border-estate-200 flex flex-col min-h-[550px]"
              >
                {/* Column header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-estate-200">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-estate-800">
                      {title}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-estate-500 bg-white px-2 py-0.5 rounded-md border border-estate-200">
                    {columnLeads.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {columnLeads.length === 0 ? (
                    <div className="text-center py-12 text-xs text-estate-400">
                      No leads in this stage
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => openLeadDetails(lead)}
                        className="card p-3.5 hover:shadow-md transition-all cursor-pointer space-y-2 border-l-4"
                        style={{ borderLeftColor: color.replace('bg-', '') }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-estate-900">
                            {lead.buyer_name || 'Buyer'}
                          </span>
                          <span className="text-[10px] text-estate-400">
                            {formatDate(lead.created_at)}
                          </span>
                        </div>

                        <p className="text-[11px] font-medium text-estate-600 line-clamp-1">
                          {lead.property_title || 'Property Inquiry'}
                        </p>

                        <p className="text-[11px] text-estate-500 line-clamp-2 bg-estate-50 p-1.5 rounded">
                          "{lead.message}"
                        </p>

                        <div className="pt-2 flex items-center justify-between text-[11px] text-estate-600 border-t border-estate-100">
                          <span className="flex items-center gap-1 font-semibold">
                            <Phone className="w-3 h-3 text-estate-400" />
                            {lead.buyer_phone}
                          </span>
                          <span className="text-[10px] font-bold uppercase bg-estate-100 px-1.5 py-0.5 rounded">
                            {lead.contact_mode}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead Detail & Timeline Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-estate-900/60 backdrop-blur-sm" onClick={() => setSelectedLead(null)} />
          <div className="relative ml-auto w-full max-w-lg bg-white h-full p-6 shadow-2xl overflow-y-auto space-y-6 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-estate-100">
                <div>
                  <span className="text-xs font-semibold uppercase text-primary-600">Lead Details</span>
                  <h3 className="text-lg font-bold text-estate-900">{selectedLead.buyer_name}</h3>
                </div>
                <button onClick={() => setSelectedLead(null)} className="p-1 text-estate-400 hover:text-estate-900">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Transition buttons */}
              <div className="py-4">
                <label className="block text-xs font-semibold uppercase text-estate-500 mb-2">Move Pipeline Stage</label>
                <div className="flex flex-wrap gap-1.5">
                  {STAGES.map(({ stage, title }) => (
                    <button
                      key={stage}
                      onClick={() => handleStageChange(selectedLead.id, stage)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
                        selectedLead.stage === stage
                          ? 'bg-estate-900 text-white shadow-sm'
                          : 'bg-estate-100 hover:bg-estate-200 text-estate-700'
                      }`}
                    >
                      {title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lead Info */}
              <div className="p-4 bg-estate-50 rounded-xl space-y-2 text-xs border border-estate-200">
                <div className="flex justify-between">
                  <span className="text-estate-400">Phone:</span>
                  <span className="font-bold text-estate-900">{selectedLead.buyer_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-estate-400">Property:</span>
                  <span className="font-bold text-estate-900 line-clamp-1">{selectedLead.property_title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-estate-400">Contact Mode:</span>
                  <span className="font-semibold text-estate-900">{selectedLead.contact_mode}</span>
                </div>
                <div className="pt-2 border-t border-estate-200 text-estate-700">
                  <strong className="block text-estate-900 mb-1">Message:</strong>
                  {selectedLead.message}
                </div>
              </div>

              {/* Activity & Notes Timeline */}
              <div className="pt-6 space-y-4">
                <h4 className="font-bold text-sm text-estate-900">Notes & Timeline</h4>

                {/* Add Note form */}
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add an internal note or meeting summary..."
                    className="input-field text-xs py-2"
                  />
                  <button
                    type="submit"
                    disabled={savingNote || !newNote.trim()}
                    className="btn-primary text-xs py-2 px-3 flex items-center gap-1 flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" /> Note
                  </button>
                </form>

                {/* Notes List */}
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {notes.map((n) => (
                    <div key={n.id} className="p-3 bg-estate-50 rounded-xl border border-estate-100 text-xs">
                      <p className="text-estate-800">{n.body}</p>
                      <div className="text-[10px] text-estate-400 mt-1 flex justify-between">
                        <span>{n.author_name || 'Owner/Broker'}</span>
                        <span>{formatDateTime(n.created_at)}</span>
                      </div>
                    </div>
                  ))}
                  {activities.map((a) => (
                    <div key={a.id} className="p-2.5 bg-primary-50/50 rounded-lg border border-primary-100 text-[11px] text-primary-900">
                      <span className="font-bold">{a.event_type.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-primary-500 block mt-0.5">{formatDateTime(a.created_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-estate-200">
              <button
                onClick={() => setSelectedLead(null)}
                className="w-full btn-outline text-xs py-2"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
