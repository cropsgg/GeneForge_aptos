'use client';

import { useWallet } from '@/app/context/WalletContext';
import { TransactionHistoryItem } from '@/app/models/history';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, AlertCircle, Calendar, Hash, FileText } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

// Status badge component
const StatusBadge = ({ status }: { status: TransactionHistoryItem['status'] }) => {
  const config = {
    success: { icon: CheckCircle, variant: 'success' as const, label: 'Success' },
    pending: { icon: Clock, variant: 'warning' as const, label: 'Pending' },
    error: { icon: AlertCircle, variant: 'destructive' as const, label: 'Failed' },
  };

  const { icon: Icon, variant, label } = config[status];
  
  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      <span>{label}</span>
    </Badge>
  );
};

// Type badge component
const TypeBadge = ({ type }: { type: TransactionHistoryItem['type'] }) => {
  const typeLabels: Record<TransactionHistoryItem['type'], string> = {
    sample: 'Sample',
    data: 'Data',
    access: 'Access',
    workflow: 'Workflow',
    ip: 'IP'
  };
  
  return (
    <Badge variant="outline" className="text-xs">
      {typeLabels[type]}
    </Badge>
  );
};

// Transaction detail row
const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-800">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-mono">{value}</span>
  </div>
);

// Transaction card component
const TransactionCard = ({ transaction }: { transaction: TransactionHistoryItem }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader className="py-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {transaction.title}
              <TypeBadge type={transaction.type} />
            </CardTitle>
            <CardDescription className="mt-1">
              {transaction.description}
            </CardDescription>
          </div>
          <StatusBadge status={transaction.status} />
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(transaction.timestamp), 'MMM d, yyyy h:mm a')}</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground overflow-hidden">
            <Hash className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{transaction.transactionHash}</span>
          </div>
        </div>
        
        {expanded && transaction.details && (
          <div className="mt-4 pt-2 border-t">
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-1" />
              Transaction Details
            </h4>
            <div className="space-y-1">
              {Object.entries(transaction.details).map(([key, value]) => (
                <DetailRow key={key} label={key} value={value.toString()} />
              ))}
            </div>
          </div>
        )}
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setExpanded(!expanded)} 
          className="mt-2 w-full text-xs"
        >
          {expanded ? 'Show Less' : 'Show Details'}
        </Button>
      </CardContent>
    </Card>
  );
};

export function TransactionHistory() {
  const { walletAddress, transactionHistory } = useWallet();
  const [filter, setFilter] = useState<TransactionHistoryItem['type'] | 'all'>('all');

  if (!walletAddress) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Connect your wallet to view transaction history.</p>
      </div>
    );
  }

  const filteredHistory = filter === 'all' 
    ? transactionHistory 
    : transactionHistory.filter(tx => tx.type === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">Transaction History</h3>
          <p className="text-sm text-muted-foreground">
            View your historical blockchain transactions for this wallet
          </p>
        </div>
        
        <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={(value) => setFilter(value as any)}>
          <TabsList className="grid grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="sample">Samples</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="access">Access</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="ip">IP</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="p-6 bg-muted/40 rounded-lg text-center">
          <p className="text-muted-foreground">No transactions found for this filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map(transaction => (
            <TransactionCard key={transaction.id} transaction={transaction} />
          ))}
        </div>
      )}
    </div>
  );
} 