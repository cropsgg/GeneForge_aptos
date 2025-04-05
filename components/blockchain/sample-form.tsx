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
import { toast } from "sonner";
import { TransactionStatus } from "./transaction-status";
import { useState } from "react";
import { useWallet } from "@/app/context/WalletContext";
import { SampleProvenanceContract } from "@/lib/contracts";

const formSchema = z.object({
  sampleId: z.string().min(2, {
    message: "Sample ID must be at least 2 characters.",
  }),
  collectionDate: z.string().min(1, {
    message: "Collection date is required.",
  }),
  source: z.string().min(2, {
    message: "Source must be at least 2 characters.",
  }),
  sampleType: z.string().min(1, {
    message: "Sample type is required.",
  }),
  notes: z.string().optional(),
});

export function SampleForm() {
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const { addTransactionToHistory, getSigningAccount } = useWallet();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sampleId: "",
      collectionDate: new Date().toISOString().split("T")[0],
      source: "",
      sampleType: "",
      notes: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setTransactionStatus("pending");
    try {
      // Get signing account from wallet
      const account = await getSigningAccount();
      if (!account) {
        throw new Error("Failed to get signing account from wallet");
      }

      // Create description string from form values
      const description = JSON.stringify({
        sampleId: values.sampleId,
        collectionDate: values.collectionDate,
        source: values.source,
        sampleType: values.sampleType,
        notes: values.notes || "",
      });

      // Initialize contract and submit transaction
      const contract = new SampleProvenanceContract();
      const txHash = await contract.registerSample(account, description);
      setTransactionHash(txHash);
      
      // Add to transaction history
      addTransactionToHistory(
        'sample',
        'Sample Registration',
        `Registered sample ${values.sampleId} of type ${values.sampleType}`,
        txHash,
        {
          sampleId: values.sampleId,
          collectionDate: values.collectionDate,
          sampleType: values.sampleType,
          source: values.source
        }
      );
      
      setTransactionStatus("success");
      toast.success("Sample registered successfully on blockchain!");
      form.reset();
    } catch (error) {
      console.error("Transaction failed:", error);
      setTransactionStatus("error");
      toast.error("Failed to register sample. Please try again.");
    }
  }

  return (
    <div className="space-y-6 p-6 rounded-lg border">
      <div>
        <h3 className="text-xl font-bold">Sample Provenance</h3>
        <p className="text-muted-foreground">
          Register and do chain of custody tracking of biological samples with immutable blockchain records
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="sampleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sample ID</FormLabel>
                  <FormControl>
                    <Input placeholder="CRISPR-001" {...field} />
                  </FormControl>
                  <FormDescription>
                    Unique identifier for this sample
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="collectionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collection Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    Date when the sample was collected
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <FormControl>
                    <Input placeholder="Lab XYZ" {...field} />
                  </FormControl>
                  <FormDescription>
                    Origin of the sample (lab, patient, etc.)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sampleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sample Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sample type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="dna">DNA</SelectItem>
                      <SelectItem value="rna">RNA</SelectItem>
                      <SelectItem value="protein">Protein</SelectItem>
                      <SelectItem value="cell">Cell Culture</SelectItem>
                      <SelectItem value="tissue">Tissue</SelectItem>
                      <SelectItem value="blood">Blood</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Type of biological sample
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Additional information about the sample"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Any additional information about the sample
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {transactionStatus !== "idle" && (
            <TransactionStatus
              status={transactionStatus}
              transactionHash={transactionHash}
            />
          )}

          <Button 
            type="submit" 
            disabled={transactionStatus === "pending"}
            className="w-full"
          >
            {transactionStatus === "pending" ? "Registering Sample..." : "Register Sample on Blockchain"}
          </Button>
        </form>
      </Form>
    </div>
  );
}