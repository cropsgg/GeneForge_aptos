"use client";

import { SampleForm } from "@/components/blockchain/sample-form";
import { DataForm } from "@/components/blockchain/data-form";
import { AccessControlForm } from "@/components/blockchain/access-form";
import { WorkflowForm } from "@/components/blockchain/workflow-form";
import { IPForm } from "@/components/blockchain/ip-form";
import { Button } from "@/components/ui/button";
import { ConnectWallet } from "@/components/blockchain/connect-wallet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/app/context/WalletContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Network } from "@aptos-labs/ts-sdk";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SampleProvenanceContract } from "@/lib/contracts/sample-provenance";
import { ExperimentalDataContract } from "@/lib/contracts/experimental-data";
import { AccessControlContract } from "@/lib/contracts/access-control";
import { WorkflowAutomationContract } from "@/lib/contracts/workflow-automation";
import { IntellectualPropertyContract } from "@/lib/contracts/intellectual-property";

export default function BlockchainPage() {
  const { walletAddress, isWalletConnected, isNetworkConnected, networkName } = useWallet();
  const [networkStatus, setNetworkStatus] = useState<{
    connected: boolean;
    name: string;
  }>({
    connected: false,
    name: "Unknown",
  });

  // Initialize contract instances
  const sampleContract = new SampleProvenanceContract();
  const dataContract = new ExperimentalDataContract();
  const accessContract = new AccessControlContract();
  const workflowContract = new WorkflowAutomationContract();
  const ipContract = new IntellectualPropertyContract();

  // Check network status
  useEffect(() => {
    if (!isWalletConnected) return;

    const checkNetworkStatus = async () => {
      try {
        setNetworkStatus({
          connected: isNetworkConnected,
          name: networkName,
        });
        
        if (!isNetworkConnected) {
          toast.error("Unable to connect to Aptos blockchain. Please check your network.");
        } else {
          toast.success(`Connected to Aptos ${networkName}`);
        }
      } catch (error) {
        console.error("Error checking network status:", error);
        setNetworkStatus({
          connected: false,
          name: "Error",
        });
      }
    };

    checkNetworkStatus();
  }, [isWalletConnected, isNetworkConnected, networkName]);

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blockchain Integration</h1>
          <p className="text-muted-foreground">
            Record and verify genetic data provenance using Aptos blockchain
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-muted p-2 rounded-md text-sm">
            <div className="font-medium">Network: {networkStatus.name}</div>
            <div className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  networkStatus.connected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span>{networkStatus.connected ? "Connected" : "Disconnected"}</span>
            </div>
          </div>
          <ConnectWallet />
        </div>
      </div>

      <Tabs defaultValue="samples" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          <TabsTrigger value="samples">Samples</TabsTrigger>
          <TabsTrigger value="data">Experimental Data</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="ip">Intellectual Property</TabsTrigger>
        </TabsList>
        
        <TabsContent value="samples" className="mt-6">
          <SampleForm />
        </TabsContent>
        
        <TabsContent value="data" className="mt-6">
          <DataForm />
        </TabsContent>
        
        <TabsContent value="access" className="mt-6">
          <AccessControlForm />
        </TabsContent>
        
        <TabsContent value="workflow" className="mt-6">
          <WorkflowForm />
        </TabsContent>
        
        <TabsContent value="ip" className="mt-6">
          <IPForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}