"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, Check } from "lucide-react";

interface ShareDialogProps {
  projectId: string;
  onInvite: (email: string) => void;
}

export function ShareDialog({ projectId, onInvite }: ShareDialogProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/project/${projectId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    onInvite(email);
    setEmail("");
    toast({
      title: "Invitation sent",
      description: "Collaboration invitation has been sent",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2 className="mr-2 h-4 w-4" />
          Share Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Project Link</label>
            <div className="flex mt-1.5">
              <Input
                readOnly
                value={shareUrl}
                className="rounded-r-none"
              />
              <Button
                onClick={handleCopy}
                variant="secondary"
                className="rounded-l-none"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div>
            <form onSubmit={handleInvite} className="flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter collaborator's email"
              />
              <Button type="submit">Invite</Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}