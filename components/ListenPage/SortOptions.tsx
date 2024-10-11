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
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Sort Options</h2>
        <Button variant="ghost" size="sm" onClick={() => setIsSortExpanded(false)} className="flex items-center gap-2">
          Close
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Select
        value={filterOptions.sortBy}
        onValueChange={(value) => setFilterOptions(prev => ({ ...prev, sortBy: value }))}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select sorting criteria" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filterOptions.sortOrder}
        onValueChange={(value) => setFilterOptions(prev => ({ ...prev, sortOrder: value as 'asc' | 'desc' }))}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select sort order" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="asc">Ascending</SelectItem>
          <SelectItem value="desc">Descending</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}