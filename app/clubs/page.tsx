"use client"

import { useState, useMemo } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ClubCard } from "@/components/club-card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { mockClubs } from "@/lib/mock-data"
import { CLUB_CATEGORIES, type ClubCategory } from "@/lib/types"
import { Search, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const TOTAL_CLUBS = mockClubs.length

export default function ClubsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<ClubCategory | "all">("all")

  // How many clubs sit in each category, so the filter chips can show a count
  // and users can pick a category instead of scrolling the full list.
  const categoryCounts = useMemo(() => {
    return mockClubs.reduce<Record<string, number>>((acc, club) => {
      acc[club.category] = (acc[club.category] ?? 0) + 1
      return acc
    }, {})
  }, [])

  const filteredClubs = useMemo(() => {
    return mockClubs.filter((club) => {
      const matchesSearch = 
        club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        club.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = 
        selectedCategory === "all" || club.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                ชมรมทั้งหมด
              </h1>
              <p className="text-muted-foreground mb-8">
                ค้นหาและเข้าร่วมชมรมที่คุณสนใจ จากกว่า <span className="numeric-font">{TOTAL_CLUBS}</span> ชมรมในมหาวิทยาลัย
              </p>

              {/* Search */}
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="ค้นหาชมรม..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Categories Filter */}
        <section className="py-6 border-b border-border bg-card">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-2">
              <Badge
                variant={selectedCategory === "all" ? "default" : "outline"}
                className="cursor-pointer px-4 py-2 text-sm transition-colors"
                onClick={() => setSelectedCategory("all")}
              >
                ทั้งหมด
                <span className="numeric-font ml-1.5 opacity-70">{mockClubs.length}</span>
              </Badge>
              {CLUB_CATEGORIES.map((category) => (
                <Badge
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer px-4 py-2 text-sm transition-colors",
                    selectedCategory === category.value && `${category.color} text-white border-transparent`
                  )}
                  onClick={() => setSelectedCategory(category.value)}
                >
                  {category.label}
                  <span className="numeric-font ml-1.5 opacity-70">
                    {categoryCounts[category.value] ?? 0}
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Clubs Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {filteredClubs.length > 0 ? (
              <>
                <p className="text-muted-foreground mb-6">
                  แสดง <span className="numeric-font">{filteredClubs.length}</span> ชมรม
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredClubs.map((club) => (
                    <ClubCard key={club.id} club={club} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  ไม่พบชมรมที่ค้นหา
                </h3>
                <p className="text-muted-foreground">
                  ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
