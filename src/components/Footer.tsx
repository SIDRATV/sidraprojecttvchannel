'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Facebook, Twitter, Instagram, Linkedin, Mail } from 'lucide-react';

export function Footer() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  const footerLinks = {
    Product: ['Features', 'Pricing', 'Security', 'Enterprise'],
    Company: ['About', 'Blog', 'Team', 'Careers'],
    Resources: ['Documentation', 'API', 'Community', 'Support'],
    Legal: ['Privacy', 'Terms', 'Cookies', 'License'],
  };

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="border-t border-gray-200 dark:border-gray-900 bg-white dark:bg-gray-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12"
        >
          {Object.entries(footerLinks).map(([category, links]) => (
            <motion.div key={category} variants={itemVariants}>
              <h3 className="font-bold text-gray-950 dark:text-white mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <Link href="#">
                      <span className="text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors text-sm">
                        {link}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Divider */}
        <div className="border-t border-gray-300 dark:border-gray-800" />

        {/* Bottom Footer */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="py-8 flex flex-col md:flex-row justify-between items-center gap-6"
        >
          {/* Logo and Copyright */}
          <motion.div variants={itemVariants} className="flex items-center gap-4">
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image
                src="/sidra-logo-v2.png?v=3"
                alt="Sidra Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <p className="font-bold text-gray-950 dark:text-white">Sidra Project TV</p>
              <p className="text-sm text-gray-500 dark:text-gray-600">© 2026 All rights reserved</p>
            </div>
          </motion.div>

          {/* Social Links */}
          <motion.div variants={itemVariants} className="flex gap-4">
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <Link key={label} href={href}>
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-brand-600/10 dark:hover:bg-brand-500/10 border border-gray-300 dark:border-gray-800 hover:border-brand-600/30 dark:hover:border-brand-500/30 transition-all"
                >
                  <Icon size={20} className="text-gray-700 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400" />
                </motion.button>
              </Link>
            ))}
          </motion.div>

          {/* Contact */}
          <motion.div variants={itemVariants} className="flex items-center gap-2">
            <Mail size={20} className="text-brand-600 dark:text-brand-400" />
            <a href="mailto:support@sidraproject.com" className="text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              support@sidraproject.com
            </a>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
}
