"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { CreditIcon, DeductionIcon } from "@/components/credit-icon"

// Mock transaction data - replace with real API data
interface Transaction {
  id: string
  type: "credit" | "deduction"
  name: string
  date: string
  amount: number
  dateGroup: string
}

const mockTransactions: Transaction[] = [
  { id: "1", type: "deduction", name: "Syra", date: "2026/08/7", amount: -0.10, dateGroup: "2020.06.09" },
  { id: "2", type: "deduction", name: "Syra", date: "2026/08/7", amount: -0.10, dateGroup: "2020.06.09" },
  { id: "3", type: "credit", name: "Syra", date: "2026/08/7", amount: 100, dateGroup: "2020.06.09" },
  { id: "4", type: "deduction", name: "Syra", date: "2026/08/7", amount: -0.10, dateGroup: "2020.06.09" },
  { id: "5", type: "deduction", name: "Syra", date: "2026/08/7", amount: -0.10, dateGroup: "2020.06.09" },
  { id: "6", type: "deduction", name: "Syra", date: "2026/08/7", amount: -0.10, dateGroup: "2020.06.09" },
  { id: "7", type: "deduction", name: "Syra", date: "2026/08/7", amount: -0.10, dateGroup: "2020.06.09" },
]

// Group transactions by date
function groupTransactionsByDate(transactions: Transaction[]) {
  const grouped: { [key: string]: Transaction[] } = {}
  transactions.forEach((t) => {
    const dateKey = t.dateGroup
    if (!grouped[dateKey]) {
      grouped[dateKey] = []
    }
    grouped[dateKey].push(t)
  })
  return grouped
}

function TransactionItem({ transaction }: { transaction: Transaction }) {
  const isCredit = transaction.type === "credit"
  
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-4">
        {isCredit ? (
          <CreditIcon size={44} />
        ) : (
          <DeductionIcon size={44} />
        )}
        <div>
          <p className="text-white font-medium text-base">{transaction.name}</p>
          <p className="text-gray-500 text-sm">{transaction.date}</p>
        </div>
      </div>
      <div
        className={`px-5 py-2.5 rounded-full text-sm font-medium ${
          isCredit
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "bg-[#252525] text-gray-300 border border-[#353535]"
        }`}
      >
        {isCredit ? transaction.amount : transaction.amount.toFixed(2)}
      </div>
    </div>
  )
}

export default function CreditsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [balance, setBalance] = useState(300)
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#101010] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  const groupedTransactions = groupTransactionsByDate(transactions)

  return (
    <div className="min-h-screen bg-[#101010]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#101010]/90 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Sycord" width={28} height={28} />
            <span className="text-lg font-semibold text-white">Sycord</span>
          </Link>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Credit Balance Section */}
        <div className="flex flex-col items-center justify-center py-12 md:py-20">
          <div className="flex items-center gap-5">
            <CreditIcon size={72} />
            <span className="text-6xl md:text-7xl font-bold text-[#5a5a5a]">{balance}</span>
          </div>
        </div>

        {/* Transaction List with Frosted Glass */}
        <div className="bg-[#181818]/90 backdrop-blur-xl border border-white/5 rounded-t-[40px] md:rounded-t-[56px] pt-8 pb-6 px-6 md:px-8 -mx-4 md:mx-0 min-h-[60vh]">
          {Object.entries(groupedTransactions).map(([date, txns]) => (
            <div key={date} className="mb-8 last:mb-0">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-5">{date}</h2>
              <div className="divide-y divide-white/5">
                {txns.map((transaction) => (
                  <TransactionItem key={transaction.id} transaction={transaction} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
