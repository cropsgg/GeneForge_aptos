"use client";

import { useState } from "react";
import { WalletProvider } from "@/app/context/WalletContext";
import { ConnectWallet } from "@/components/blockchain/connect-wallet";
import { DataForm } from "@/components/blockchain/data-form";
import { SampleForm } from "@/components/blockchain/sample-form";
import { TransactionHistory } from "@/components/blockchain/transaction-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

export default function BlockchainPage() {
  return (
    <WalletProvider>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center space-y-8"
        >
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">CRISPR Cas9 Blockchain Operations</h1>
            <p className="text-muted-foreground max-w-2xl">
              Interact with smart contracts to manage samples, experimental data, access control, workflow automation, and intellectual property.
            </p>
          </div>

          <div className="w-full max-w-4xl">
            <div className="mb-8 flex justify-center">
              <ConnectWallet />
            </div>

            <Tabs defaultValue="samples" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="samples">Samples</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="access">Access</TabsTrigger>
                <TabsTrigger value="workflow">Workflow</TabsTrigger>
                <TabsTrigger value="ip">IP</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              <TabsContent value="samples">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <SampleForm />
                </motion.div>
              </TabsContent>
              <TabsContent value="data">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <DataForm />
                </motion.div>
              </TabsContent>
              <TabsContent value="access">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="p-6 rounded-lg border">
                    <h3 className="text-xl font-bold mb-4">Access Control & Permission Management</h3>
                    <p className="text-muted-foreground mb-4">
                      Define roles, grant permissions, and track access to sensitive experimental data.
                    </p>
                    <div className="text-center p-12 text-muted-foreground">
                      Access Control form to be implemented
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
              <TabsContent value="workflow">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="p-6 rounded-lg border">
                    <h3 className="text-xl font-bold mb-4">Workflow Automation & Compliance</h3>
                    <p className="text-muted-foreground mb-4">
                      Automate approval steps, enforce regulatory compliance, and manage workflow transitions.
                    </p>
                    <div className="text-center p-12 text-muted-foreground">
                      Workflow Automation form to be implemented
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
              <TabsContent value="ip">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="p-6 rounded-lg border">
                    <h3 className="text-xl font-bold mb-4">Intellectual Property & Attribution</h3>
                    <p className="text-muted-foreground mb-4">
                      Register contributions, timestamp innovations, and manage licensing for gene editing methods.
                    </p>
                    <div className="text-center p-12 text-muted-foreground">
                      Intellectual Property form to be implemented
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
              <TabsContent value="history">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="p-6 rounded-lg border">
                    <TransactionHistory />
                  </div>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </div>
    </WalletProvider>
  );
}