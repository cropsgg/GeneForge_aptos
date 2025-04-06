"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { TransactionStatus } from "./transaction-status";
import { useState } from "react";
import { useWallet } from "@/app/context/WalletContext";
import { CONTRACT_ADDRESS, MODULE_NAMES, FUNCTIONS } from "@/lib/contracts/config";
import { stringToBytes } from "@/lib/contracts/aptos-client";
import { Types } from "aptos";

const createTaskSchema = z.object({
  description: z.string().min(5, {
    message: "Description must be at least 5 characters.",
  }),
  assignee: z.string().min(2, {
    message: "Assignee must be at least 2 characters.",
  }),
  deadline: z.string().min(1, {
    message: "Deadline is required.",
  }),
  priority: z.string().min(1, {
    message: "Priority is required.",
  }),
});

const updateTaskSchema = z.object({
  taskId: z.string().min(1, {
    message: "Task ID is required.",
  }),
  status: z.string().min(1, {
    message: "Status is required.",
  }),
  notes: z.string().optional(),
});

export function WorkflowForm() {
  const [activeTab, setActiveTab] = useState("create");
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const { walletAddress, isWalletConnected, submitTransaction } = useWallet();

  const createForm = useForm<z.infer<typeof createTaskSchema>>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      description: "",
      assignee: "",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      priority: "medium",
    },
  });

  const updateForm = useForm<z.infer<typeof updateTaskSchema>>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      taskId: "",
      status: "in_progress",
      notes: "",
    },
  });

  async function onCreateSubmit(values: z.infer<typeof createTaskSchema>) {
    if (!isWalletConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    setTransactionStatus("pending");
    try {
      // Prepare the task description as a JSON string
      const taskDescription = JSON.stringify({
        description: values.description,
        deadline: values.deadline,
        priority: values.priority
      });
      
      // Create the transaction payload
      const payload: Types.EntryFunctionPayload = {
        function: `${CONTRACT_ADDRESS}::${MODULE_NAMES.WORKFLOW_AUTOMATION}::${FUNCTIONS.CREATE_TASK}`,
        type_arguments: [],
        arguments: [Array.from(stringToBytes(taskDescription)), values.assignee]
      };
      
      // Submit the transaction
      const result = await submitTransaction(payload);
      
      // Store the transaction hash
      setTransactionHash(result.hash);
      
      setTransactionStatus("success");
      toast.success("Task created successfully on the blockchain!");
      
      // Reset the form
      createForm.reset({
        description: "",
        assignee: "",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        priority: "medium",
      });
    } catch (error) {
      console.error("Transaction failed:", error);
      setTransactionStatus("error");
      toast.error(`Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async function onUpdateSubmit(values: z.infer<typeof updateTaskSchema>) {
    if (!isWalletConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    setTransactionStatus("pending");
    try {
      // Convert status string to number
      const statusMap = {
        pending: 0,
        in_progress: 1,
        completed: 2,
        approved: 3
      };
      const statusValue = statusMap[values.status as keyof typeof statusMap];
      
      // Create the transaction payload
      const payload: Types.EntryFunctionPayload = {
        function: `${CONTRACT_ADDRESS}::${MODULE_NAMES.WORKFLOW_AUTOMATION}::${FUNCTIONS.UPDATE_TASK_STATUS}`,
        type_arguments: [],
        arguments: [parseInt(values.taskId), statusValue]
      };
      
      // Submit the transaction
      const result = await submitTransaction(payload);
      
      // Store the transaction hash
      setTransactionHash(result.hash);
      
      setTransactionStatus("success");
      toast.success("Task status updated successfully on the blockchain!");
      
      // Reset the form
      updateForm.reset({
        taskId: "",
        status: "in_progress",
        notes: "",
      });
    } catch (error) {
      console.error("Transaction failed:", error);
      setTransactionStatus("error");
      toast.error(`Failed to update task status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return (
    <div className="space-y-6 p-6 rounded-lg border">
      <div>
        <h3 className="text-xl font-bold">Workflow Automation</h3>
        <p className="text-muted-foreground">
          Create and manage workflow tasks with blockchain verification
        </p>
      </div>

      {!isWalletConnected && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 mb-4">
          Please connect your wallet to manage workflow tasks on the blockchain.
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Task</TabsTrigger>
          <TabsTrigger value="update">Update Status</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the task in detail" 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Detailed description of the task requirements
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="assignee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assignee</FormLabel>
                        <FormControl>
                          <Input placeholder="0x123...abc or user@example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          User responsible for completing the task
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deadline</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          Task completion deadline
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Task priority level
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {transactionHash && (
                <TransactionStatus 
                  status={transactionStatus} 
                  transactionHash={transactionHash} 
                />
              )}

              <Button 
                type="submit" 
                disabled={!isWalletConnected || transactionStatus === "pending"}
                className="w-full"
              >
                {transactionStatus === "pending" ? "Creating Task..." : "Create Task"}
              </Button>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="update">
          <Form {...updateForm}>
            <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={updateForm.control}
                  name="taskId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task ID</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="1" {...field} />
                      </FormControl>
                      <FormDescription>
                        ID of the task to update
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={updateForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        New status for the task
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={updateForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add notes about this status change" 
                          className="min-h-[80px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Additional context for the status update
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {transactionHash && (
                <TransactionStatus 
                  status={transactionStatus} 
                  transactionHash={transactionHash} 
                />
              )}

              <Button 
                type="submit" 
                disabled={!isWalletConnected || transactionStatus === "pending"}
                className="w-full"
              >
                {transactionStatus === "pending" ? "Updating Status..." : "Update Status"}
              </Button>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
} 