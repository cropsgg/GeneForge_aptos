"use client";

import { motion, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Button } from '@/components/ui/button';
import { ArrowRight, Database, FlaskRound as Flask, Shield, Zap, Dna, Lock, FileCheck, Award } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import the DnaHelixContainer with SSR disabled and error fallback
const DnaHelixContainer = dynamic(
  () => import('./components/3d/DnaHelixContainer').catch(() => () => null),
  { 
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10" />
  }
);

export default function Home() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 50]);
  const y2 = useTransform(scrollY, [0, 300], [0, -50]);
  const opacity = useTransform(scrollY, [0, 200], [1, 0]);

  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const features = [
    {
      icon: Dna,
      title: "CRISPR Cas9 Analysis",
      description: "Pattern recognition and predictive analysis for gene editing sequences with AI assistance"
    },
    {
      icon: Database,
      title: "Blockchain Verification",
      description: "Immutable and transparent verification of genomic data and research findings"
    },
    {
      icon: FileCheck,
      title: "Data Integrity",
      description: "Cryptographic hashing and verification to ensure experimental data remains unaltered"
    },
    {
      icon: Lock,
      title: "Secure Collaboration",
      description: "Role-based permissions with granular access control for sensitive genetic data"
    },
    {
      icon: Zap,
      title: "Automated Workflows",
      description: "Smart contract-powered automation for research compliance and experiment validation"
    },
    {
      icon: Award,
      title: "Intellectual Attribution",
      description: "Blockchain timestamps and signatures for proper credit of scientific contributions"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <DnaHelixContainer
            color1="#2563eb" 
            color2="#7c3aed"
            count={25}
            radius={1.5}
            height={10}
            autoRotateSpeed={0.3}
            particles={40}
          />
        </div>
        <motion.div 
          style={{ y: y1 }}
          className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 dark:from-primary/10 dark:to-secondary/10 z-10" 
        />
        <motion.div
          style={{ y: y2, opacity }}
          className="absolute top-1/4 -left-20 w-60 h-60 bg-primary/30 rounded-full blur-3xl z-10"
        />
        <motion.div
          style={{ y: y1, opacity }}
          className="absolute bottom-1/4 -right-20 w-60 h-60 bg-secondary/30 rounded-full blur-3xl z-10"
        />
        <div className="container mx-auto px-4 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80 dna-glow dna-pulse"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, type: "spring" }}
            >
              GeneForge: Blockchain CRISPR Platform
            </motion.h1>
            <motion.p 
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 dna-glow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Secure genomic research with blockchain verification - enabling transparent, 
              traceable and immutable gene editing workflows with Aptos blockchain
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <Button size="lg" className="group magnetic-button glow-effect" asChild>
                <Link href="/blockchain">
                  Explore Blockchain
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="magnetic-button gradient-border">
                View Documentation
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={ref} className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">Platform Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Leveraging Aptos blockchain to bring integrity, transparency and security to CRISPR Cas9 genetic research
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  className="p-6 bg-card rounded-lg shadow-lg hover:shadow-xl transition-shadow gradient-border floating"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}