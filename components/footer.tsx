import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Github, 
  Twitter, 
  Linkedin, 
  ArrowRight,
  BookOpen,
  FileText 
} from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-muted py-12 mt-auto border-t">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="font-bold text-xl mb-4 block">
              GeneForge
            </Link>
            <p className="text-muted-foreground mb-4 max-w-md">
              Next-generation genomic research platform powered by blockchain technology for secure, transparent, and collaborative scientific work.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" aria-label="GitHub">
                <Github className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/blockchain" className="text-muted-foreground hover:text-primary">
                  Blockchain
                </Link>
              </li>
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary">
                  Features
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/documentation" className="text-muted-foreground hover:text-primary">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/api" className="text-muted-foreground hover:text-primary">
                  API
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-primary">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} GeneForge. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>Documentation</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Whitepaper</span>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}