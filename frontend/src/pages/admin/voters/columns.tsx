import { ColumnDef } from "@tanstack/react-table"
import { Voter } from "@/types"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash2, QrCode, Download } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { getStatusColor, getStatusLabel } from "@/lib/utils"
import { Link } from "react-router-dom"

export const getColumns = (
  onGenerateQR: (id: string) => void,
  onDelete: (id: string) => void
): ColumnDef<Voter>[] => [
    {
      accessorKey: "full_name",
      header: "Nama",
      cell: ({ row }) => {
        const voter = row.original
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-primary">
              {voter.full_name}
            </span>
            {voter.identity_number && (
              <span className="text-xs text-muted-foreground mt-0.5">{voter.identity_number}</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "unique_code",
      header: "Unique Code",
      cell: ({ row }) => {
        return <code className="text-xs bg-muted px-2 py-1 rounded">{row.getValue("unique_code")}</code>
      },
    },
    {
      accessorKey: "group_name",
      header: "Kelompok",
      cell: ({ row }) => row.getValue("group_name") || "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant="secondary" className={getStatusColor(status)}>
            {getStatusLabel(status)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "is_anonymous",
      header: "Anonim",
      cell: ({ row }) => {
        const isAnon = row.getValue("is_anonymous") as boolean
        return isAnon ? <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Ya</Badge> : <span className="text-muted-foreground">Tidak</span>
      },
    },
    {
      id: "actions",
      header: () => <div className="w-10"></div>,
      cell: ({ row }) => {
        const voter = row.original

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger className="h-8 w-8 p-0 flex items-center justify-center rounded-md hover:bg-muted">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuItem>
                  <Link to={`/admin/voters/${voter.id}/edit`} className="flex w-full items-center">
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onGenerateQR(voter.id)}>
                  <QrCode className="mr-2 h-4 w-4" /> Generate QR
                </DropdownMenuItem>
                {voter.qr_code_url && (
                  <DropdownMenuItem>
                    <a href={voter.qr_code_url} download target="_blank" rel="noopener noreferrer" className="flex w-full items-center">
                      <Download className="mr-2 h-4 w-4" /> Download QR
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(voter.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                  <Trash2 className="mr-2 h-4 w-4" /> Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]
