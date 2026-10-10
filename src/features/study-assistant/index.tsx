"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";

export function StudyAssistantFeature() {
  const [subject, setSubject] = useState("Software Engineering");
  const [schedule, setSchedule] = useState("");

  const generatePlan = () => {
    setSchedule(
      `Demo AI schedule for ${subject}:\nMon 7:00pm - Revision\nWed 6:30pm - Practice questions\nSat 10:00am - Mock test\n\nNote: This is a frontend demo response until backend AI integration is connected.`,
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="AI Study Assistant"
        description="Demo interface for AI-assisted study planning and timetable generation."
      />
      <Card>
        <h2 className="font-semibold text-slate-900">Plan generator</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Priority subject</label>
            <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Preferred session duration</label>
            <Select>
              <option>45 minutes</option>
              <option>60 minutes</option>
              <option>90 minutes</option>
            </Select>
          </div>
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-sm font-medium">Constraints</label>
          <Textarea placeholder="Available days, existing commitments, break preferences..." rows={3} />
        </div>
        <Button className="mt-4" onClick={generatePlan}>Generate demo study plan</Button>
      </Card>
      <Card>
        <h3 className="font-semibold">Generated output</h3>
        <Textarea value={schedule} readOnly rows={8} placeholder="Your generated demo response appears here." className="mt-3" />
      </Card>
    </div>
  );
}
