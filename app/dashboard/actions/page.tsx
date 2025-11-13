"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Play, Pause, Trash2, RefreshCw, Sparkles } from "lucide-react";
import { useProjects } from "@/lib/projects-context";

type Action = {
  id: string;
  brand_id: string;
  action_type: string;
  title: string;
  description: string | null;
  context: string | null;
  tone: string;
  status: string;
  posted_at: string | null;
  tweet_url: string | null;
  post_text: string | null;
  created_at: string;
};

const ACTION_TYPES = [
  { value: "announcement", label: "📢 Announcement", emoji: "📢" },
  { value: "engagement", label: "🎯 Engagement", emoji: "🎯" },
  { value: "excitement", label: "🎉 Excitement", emoji: "🎉" },
  { value: "promotion", label: "💼 Promotion", emoji: "💼" },
  { value: "education", label: "📚 Education", emoji: "📚" },
  { value: "community", label: "🤝 Community", emoji: "🤝" },
  { value: "metrics", label: "📊 Metrics", emoji: "📊" },
];

const TONE_OPTIONS = [
  { value: "engaging", label: "🎯 Engaging" },
  { value: "professional", label: "💼 Professional" },
  { value: "casual", label: "😊 Casual" },
  { value: "inspiring", label: "✨ Inspiring" },
  { value: "humorous", label: "😄 Humorous" },
];

export default function ActionsPage() {
  const { currentProject } = useProjects();
  const brandId = currentProject?.id || "";

  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    actionType: "announcement",
    title: "",
    description: "",
    context: "",
    tone: "engaging",
  });

  // Fetch actions
  const fetchActions = async () => {
    if (!brandId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/actions/list?brandId=${brandId}`);
      const data = await response.json();

      if (data.success) {
        setActions(data.actions || []);
      }
    } catch (error) {
      console.error("Failed to fetch actions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, [brandId]);

  // Create action
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!brandId) {
      alert("❌ Error: No brand selected. Please select a project first.");
      return;
    }

    if (!formData.title || formData.title.trim() === "") {
      alert("❌ Error: Title is required. Please enter a goal/title for this action.");
      return;
    }

    if (!formData.actionType) {
      alert("❌ Error: Action type is required.");
      return;
    }

    try {
      console.log("📝 Creating action with data:", {
        brandId,
        ...formData,
      });

      const response = await fetch("/api/actions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          actionType: formData.actionType,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          context: formData.context.trim() || null,
          tone: formData.tone || "engaging",
        }),
      });

      const data = await response.json();

      console.log("📥 Response:", data);

      if (data.success) {
        alert("✅ Action created successfully!");
        setShowForm(false);
        setFormData({
          actionType: "announcement",
          title: "",
          description: "",
          context: "",
          tone: "engaging",
        });
        fetchActions();
      } else {
        alert(`❌ Failed to create action: ${data.error || "Unknown error"}`);
        console.error("Create action error:", data);
      }
    } catch (error: any) {
      console.error("Create action exception:", error);
      alert(`❌ Error: ${error.message || "Failed to create action. Check console for details."}`);
    }
  };

  // Delete action
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this action?")) return;

    try {
      const response = await fetch("/api/actions/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (data.success) {
        fetchActions();
      } else {
        alert(`Failed to delete: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  // Pause/Resume action
  const handleTogglePause = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "paused" ? "pending" : "paused";

    try {
      const response = await fetch("/api/actions/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        fetchActions();
      } else {
        alert(`Failed to update: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  // Post action now (manual trigger)
  const handlePostNow = async (action: Action) => {
    if (!confirm(`Post this action now?\n\n"${action.title}"`)) return;

    try {
      const response = await fetch("/api/actions/post-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: action.id }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Posted successfully!\n\n"${data.post_text}"`);
        fetchActions();
      } else {
        // Improved error handling with user-friendly messages
        const errorMsg = data.error || "Unknown error";

        if (errorMsg.includes("temporarily unavailable") || errorMsg.includes("service is currently unavailable")) {
          alert(`⏳ The AI service is temporarily unavailable. This is usually brief.\n\n💡 You can:\n• Try again in a few minutes\n• The system will retry automatically with the hourly posting\n\nError details: ${errorMsg}`);
        } else if (errorMsg.includes("Failed after") && errorMsg.includes("attempts")) {
          alert(`❌ Failed to post after multiple retry attempts.\n\nThe AI service may be experiencing issues. Please try again later or contact support.\n\nError: ${errorMsg}`);
        } else {
          alert(`❌ Failed to post: ${errorMsg}`);
        }
      }
    } catch (error: any) {
      alert(`❌ Network error: ${error.message}\n\nPlease check your connection and try again.`);
    }
  };

  const pendingActions = actions.filter((a) => a.status === "pending");
  const completedActions = actions.filter((a) => a.status === "completed");
  const pausedActions = actions.filter((a) => a.status === "paused");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-3xl font-bold mb-1">Content Actions</h1>
          <p className="text-sm text-neutral-600">
            Automated posting runs every hour • {pendingActions.length} pending
            {brandId && (
              <span className="ml-2 text-xs text-purple-600">
                (Brand: {currentProject?.name || brandId.slice(0, 8)}...)
              </span>
            )}
            {!brandId && (
              <span className="ml-2 text-xs text-red-600">
                ⚠️ No brand selected - select a project first
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchActions}
            variant="outline"
            className="font-mono"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-mono"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Action
          </Button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="p-6 border-2 border-purple-200 bg-purple-50">
          <h2 className="font-mono font-bold text-lg mb-4">Create New Action</h2>
          {!brandId && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-mono">
                ⚠️ <strong>No brand selected!</strong> Please select a project from the top dropdown first.
              </p>
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label className="font-mono">Action Type *</Label>
              <Select
                value={formData.actionType}
                onValueChange={(value) =>
                  setFormData({ ...formData, actionType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="font-mono">Goal/Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="E.g., Announce new AI feature launch"
                required
                className="font-mono"
              />
            </div>

            <div>
              <Label className="font-mono">Description</Label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="More details about this action..."
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono text-sm"
                rows={2}
              />
            </div>

            <div>
              <Label className="font-mono">Additional Context</Label>
              <textarea
                value={formData.context}
                onChange={(e) =>
                  setFormData({ ...formData, context: e.target.value })
                }
                placeholder="Any specific details or talking points..."
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono text-sm"
                rows={2}
              />
            </div>

            <div>
              <Label className="font-mono">Tone</Label>
              <Select
                value={formData.tone}
                onValueChange={(value) =>
                  setFormData({ ...formData, tone: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map((tone) => (
                    <SelectItem key={tone.value} value={tone.value}>
                      {tone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                Create Action
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Pending Actions */}
      {loading ? (
        <div className="text-center py-12 text-neutral-500 font-mono">
          Loading actions...
        </div>
      ) : (
        <>
          <div>
            <h2 className="font-mono font-bold text-lg mb-3">
              ⏳ Pending ({pendingActions.length})
            </h2>
            {pendingActions.length === 0 ? (
              <Card className="p-8 text-center text-neutral-500 font-mono">
                No pending actions. Create one to get started!
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingActions.map((action) => (
                  <Card key={action.id} className="p-4 border border-neutral-300">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">
                            {ACTION_TYPES.find((t) => t.value === action.action_type)
                              ?.emoji || "📝"}
                          </span>
                          <h3 className="font-mono font-semibold">
                            {action.title}
                          </h3>
                        </div>
                        {action.description && (
                          <p className="text-sm text-neutral-600 font-mono mb-2">
                            {action.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-neutral-500 font-mono">
                          <span>Type: {action.action_type}</span>
                          <span>Tone: {action.tone}</span>
                          <span>
                            Created: {new Date(action.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => handlePostNow(action)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          title="Post now"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleTogglePause(action.id, action.status)}
                          size="sm"
                          variant="outline"
                          title="Pause"
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(action.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Paused Actions */}
          {pausedActions.length > 0 && (
            <div>
              <h2 className="font-mono font-bold text-lg mb-3">
                ⏸️ Paused ({pausedActions.length})
              </h2>
              <div className="space-y-3">
                {pausedActions.map((action) => (
                  <Card key={action.id} className="p-4 border border-orange-300 bg-orange-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">
                            {ACTION_TYPES.find((t) => t.value === action.action_type)
                              ?.emoji || "📝"}
                          </span>
                          <h3 className="font-mono font-semibold">
                            {action.title}
                          </h3>
                        </div>
                        {action.description && (
                          <p className="text-sm text-neutral-600 font-mono mb-2">
                            {action.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => handleTogglePause(action.id, action.status)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          title="Resume"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(action.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed Actions */}
          {completedActions.length > 0 && (
            <div>
              <h2 className="font-mono font-bold text-lg mb-3">
                ✅ Completed ({completedActions.length})
              </h2>
              <div className="space-y-3">
                {completedActions.map((action) => (
                  <Card key={action.id} className="p-4 border border-green-300 bg-green-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">
                            {ACTION_TYPES.find((t) => t.value === action.action_type)
                              ?.emoji || "📝"}
                          </span>
                          <h3 className="font-mono font-semibold">
                            {action.title}
                          </h3>
                        </div>
                        {action.post_text && (
                          <p className="text-sm text-neutral-700 font-mono italic mb-2">
                            "{action.post_text}"
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-neutral-600 font-mono">
                          <span>
                            Posted: {action.posted_at ? new Date(action.posted_at).toLocaleString() : "N/A"}
                          </span>
                          {action.tweet_url && (
                            <a
                              href={action.tweet_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View on X →
                            </a>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleDelete(action.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 ml-4"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

