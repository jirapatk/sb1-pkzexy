"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { LayersIcon } from "lucide-react";
import type { VariableGroup } from "@/lib/types";

interface VariableGroupDialogProps {
  variables: string[];
  onGroupCreate: (group: Omit<VariableGroup, "id">) => void;
}

export function VariableGroupDialog({ variables, onGroupCreate }: VariableGroupDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    if (selectedVariables.length < 2) {
      toast({
        title: "Error",
        description: "Select at least 2 variables",
        variant: "destructive",
      });
      return;
    }

    onGroupCreate({
      name,
      description,
      variables: selectedVariables,
    });
    setName("");
    setDescription("");
    setSelectedVariables([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <LayersIcon className="mr-2 h-4 w-4" />
          Create Variable Group
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Variable Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Group Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter group description"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Select Variables</label>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              {variables.map((variable) => (
                <div key={variable} className="flex items-center space-x-2 py-2">
                  <Checkbox
                    id={variable}
                    checked={selectedVariables.includes(variable)}
                    onCheckedChange={(checked) => {
                      setSelectedVariables(prev =>
                        checked
                          ? [...prev, variable]
                          : prev.filter(v => v !== variable)
                      );
                    }}
                  />
                  <label htmlFor={variable} className="text-sm">
                    {variable}
                  </label>
                </div>
              ))}
            </ScrollArea>
          </div>
          <Button type="submit" className="w-full">Create Group</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}