"use client";

import React from "react";
import { Dispatch, SetStateAction } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectGroup } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, RefreshCw, ArrowUpDown } from "lucide-react";
import { motion } from "framer-motion";
import { FilterOptions } from "@/pages/listen"; // Adjust the import path as necessary

interface SortOptionsProps {
  filterOptions: FilterOptions;
  setFilterOptions: Dispatch<SetStateAction<FilterOptions>>;
  setIsSortExpanded: Dispatch<SetStateAction<boolean>>;
}

export function SortOptions({ filterOptions, setFilterOptions, setIsSortExpanded }: SortOptionsProps) {
  const sortOptions = [
    { value: 'mostRecent', label: 'Most Recent' },
    { value: 'playCount', label: 'Play Count' },
    { value: 'likes', label: 'Likes' },
    { value: 'voteBestMusically', label: 'Votes: Best Musically' },
    { value: 'voteBestLyrically', label: 'Votes: Best Lyrically' },
    { value: 'voteBestOverall', label: 'Votes: Best Overall' },
    { value: 'firstBibleVerse', label: 'Bible Verse (First in Song)' },
  ];

  const clearSort = () => {
    setFilterOptions(prev => ({ 
      ...prev, 
      sortBy: 'mostRecent',
      sortOrder: 'desc'
    }))
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl">
            <ArrowUpDown className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Sort Options</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Organize songs by your preferred criteria
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearSort}
          className="flex items-center gap-2 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300 rounded-xl"
        >
          <RefreshCw className="h-4 w-4" />
          Reset Sort
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SortSelect
          title="Sort By"
          value={filterOptions.sortBy}
          onChange={(value) => setFilterOptions(prev => ({ ...prev, sortBy: value }))}
          options={sortOptions}
        />
        <SortSelect
          title="Sort Order"
          value={filterOptions.sortOrder}
          onChange={(value) => setFilterOptions(prev => ({ ...prev, sortOrder: value as 'asc' | 'desc' }))}
          options={[
            { value: "asc", label: "Ascending" },
            { value: "desc", label: "Descending" }
          ]}
        />
      </div>
    </motion.div>
  );
}

interface SortSelectProps {
  title: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}

function SortSelect({ title, value, onChange, options }: SortSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300 rounded-xl h-12">
        <SelectValue placeholder={title} />
      </SelectTrigger>
      <SelectContent className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/30 dark:border-slate-700/30 rounded-xl">
        <SelectGroup>
          <SelectLabel className="text-emerald-600 dark:text-emerald-400 font-semibold">{title}</SelectLabel>
          {options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              className="hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 transition-all duration-200 rounded-lg"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}