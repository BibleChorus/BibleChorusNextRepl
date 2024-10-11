"use client";

import React from "react";
import { Dispatch, SetStateAction } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold">Sort Options</h2>
        <Button variant="ghost" size="sm" onClick={() => setIsSortExpanded(false)} className="h-7 text-xs px-2 flex items-center gap-1">
          Close
          <X className="h-3 w-3" />
        </Button>
      </div>

      <Select
        value={filterOptions.sortBy}
        onValueChange={(value) => setFilterOptions(prev => ({ ...prev, sortBy: value }))}
      >
        <SelectTrigger className="w-full h-8 text-xs">
          <SelectValue placeholder="Select sorting criteria" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map(option => (
            <SelectItem key={option.value} value={option.value} className="text-xs">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filterOptions.sortOrder}
        onValueChange={(value) => setFilterOptions(prev => ({ ...prev, sortOrder: value as 'asc' | 'desc' }))}
      >
        <SelectTrigger className="w-full h-8 text-xs">
          <SelectValue placeholder="Select sort order" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="asc" className="text-xs">Ascending</SelectItem>
          <SelectItem value="desc" className="text-xs">Descending</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}