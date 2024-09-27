"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from 'next/link'
import { Song } from '../listen' // Adjust the import path if necessary

// Define the columns for the DataTable
export const columns: ColumnDef<Song>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      // Link to the song's detail page
      <Link href={`/Songs/${row.getValue('id')}`} className="text-blue-500 hover:underline">
        {row.getValue('title')}
      </Link>
    ),
  },
  {
    accessorKey: 'artist',
    header: 'Artist',
  },
  {
    accessorKey: 'genre',
    header: 'Genre',
  },
  {
    accessorKey: 'created_at',
    header: 'Date Added',
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at'))
      return date.toLocaleDateString()
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const song = row.original
      return (
        <div>
          {/* Placeholder for Play button */}
          <button
            className="text-blue-500 hover:underline"
            onClick={() => console.log('Play song:', song.audio_url)}
          >
            Play
          </button>
        </div>
      )
    },
  },
]