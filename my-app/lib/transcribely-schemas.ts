import { z } from "zod";

export const prioritySchema = z.enum(["High", "Medium", "Low"]);

export const ticketSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  priority: prioritySchema,
  description: z.string().min(1),
  acceptance_criteria: z.array(z.string().min(1)).default([]),
});

export const departmentActionItemSchema = z.object({
  department: z.string().min(1),
  action: z.string().min(1),
  owner_type: z.string().min(1),
});

export const orchestrationResponseSchema = z.object({
  executive_summary: z.string(),
  key_decisions: z.array(z.string()).default([]),
  open_questions: z.array(z.string()).default([]),
  department_action_items: z.array(departmentActionItemSchema).default([]),
  tickets: z.array(ticketSchema).default([]),
  metadata: z.object({
    model: z.string(),
    ticket_count: z.number().int().nonnegative(),
    source: z.enum(["text", "file"]),
  }),
});

export const publishedClickUpTaskSchema = z.object({
  local_ticket_id: z.string().min(1),
  clickup_task_id: z.string().min(1),
  name: z.string().min(1),
  url: z.string().url(),
  status: z.string().min(1),
  checklist_created: z.boolean(),
  checklist_item_count: z.number().int().nonnegative(),
  warning: z.string().nullable().optional(),
});

export const failedClickUpTaskSchema = z.object({
  local_ticket_id: z.string().min(1),
  title: z.string().min(1),
  error: z.string().min(1),
});

export const publishTicketsResponseSchema = z.object({
  created: z.array(publishedClickUpTaskSchema),
  failed: z.array(failedClickUpTaskSchema),
});

export const projectManagementProviderSchema = z.enum([
  "clickup",
  "jira",
  "trello",
  "other",
]);

export const projectManagementConnectionResponseSchema = z.object({
  provider: projectManagementProviderSchema,
  connected: z.boolean(),
  message: z.string(),
  workspace_name: z.string().nullable().optional(),
});

export const ticketStreamEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("token"),
    data: z.object({
      content: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal("error"),
    data: z.object({
      message: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal("final"),
    data: orchestrationResponseSchema,
  }),
]);

export type Priority = z.infer<typeof prioritySchema>;
export type Ticket = z.infer<typeof ticketSchema>;
export type DepartmentActionItem = z.infer<typeof departmentActionItemSchema>;
export type OrchestrationResponse = z.infer<typeof orchestrationResponseSchema>;
export type PublishedClickUpTask = z.infer<typeof publishedClickUpTaskSchema>;
export type FailedClickUpTask = z.infer<typeof failedClickUpTaskSchema>;
export type PublishTicketsResponse = z.infer<
  typeof publishTicketsResponseSchema
>;
export type ProjectManagementProvider = z.infer<
  typeof projectManagementProviderSchema
>;
export type ProjectManagementConnectionResponse = z.infer<
  typeof projectManagementConnectionResponseSchema
>;
export type TicketStreamEvent = z.infer<typeof ticketStreamEventSchema>;
