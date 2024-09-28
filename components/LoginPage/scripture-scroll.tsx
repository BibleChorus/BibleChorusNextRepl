import { useState, useEffect, useRef } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

const scriptures = [
  { verse: "To the only God our Savior, through Jesus Christ our Lord, be glory, majesty, dominion, and authority before all time and now and forever. Amen.", reference: "Jude 1:25" },
  { verse: "Shout joyfully to the Lord, all the earth; Be cheerful and sing for joy and sing praises.", reference: "Psalm 98:4" },
  { verse: "Let the word of Christ richly dwell within you, with all wisdom teaching and admonishing one another with psalms, hymns, and spiritual songs, singing with thankfulness in your hearts to God.", reference: "Colossians 3:16" },
  { verse: "Speaking to one another in psalms and hymns and spiritual songs, singing and making melody with your hearts to the Lord.", reference: "Ephesians 5:19" },
  { verse: "Sing to Him, sing praises to Him; Tell of all His wonders.", reference: "Psalm 105:2" },
  { verse: "Sing to the Lord a new song; Sing to the Lord, all the earth. Sing to the Lord, bless His name; Proclaim the good news of His salvation from day to day.", reference: "Psalm 96:1-2" },
  { verse: "Sing to the Lord, all the earth; Proclaim good news of His salvation from day to day.", reference: "1 Chronicles 16:23" },
  { verse: "Everything that has breath shall praise the Lord. Praise the Lord!", reference: "Psalm 150:6" },
  { verse: "For this reason also God highly exalted Him, and bestowed on Him the name which is above every name, so that at the name of Jesus every knee will bow, of those who are in heaven and on earth and under the earth, and that every tongue will confess that Jesus Christ is Lord, to the glory of God the Father.", reference: "Philippians 2:9-11" },
]

export function ScriptureScroll() {
  const [currentIndices, setCurrentIndices] = useState<number[]>([0, 1, 2])
  const [fontSize, setFontSize] = useState(18)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const adjustFontSize = () => {
      if (containerRef.current) {
        const containerHeight = containerRef.current.clientHeight
        const cardHeight = containerHeight / 3 - 16 // Subtracting margin
        let newFontSize = 18

        while (newFontSize > 12) {
          if (isTextFitting(cardHeight, newFontSize)) {
            break
          }
          newFontSize -= 0.5
        }

        setFontSize(newFontSize)
      }
    }

    adjustFontSize()
    window.addEventListener('resize', adjustFontSize)
    return () => window.removeEventListener('resize', adjustFontSize)
  }, [currentIndices])

  useEffect(() => {
    const interval = setInterval(() => {
      handleNext()
    }, 7000)

    return () => clearInterval(interval)
  }, [])

  const isTextFitting = (cardHeight: number, fontSize: number) => {
    const testDiv = document.createElement('div')
    testDiv.style.fontSize = `${fontSize}px`
    testDiv.style.position = 'absolute'
    testDiv.style.visibility = 'hidden'
    testDiv.style.width = `${containerRef.current!.clientWidth - 32}px` // Subtracting padding
    document.body.appendChild(testDiv)

    let isFitting = true
    for (let index of currentIndices) {
      testDiv.innerHTML = `<h3 class="font-semibold mb-2">${scriptures[index].reference}</h3><p>${scriptures[index].verse}</p>`
      if (testDiv.offsetHeight > cardHeight) {
        isFitting = false
        break
      }
    }

    document.body.removeChild(testDiv)
    return isFitting
  }

  const handlePrev = () => {
    setCurrentIndices(prev => {
      const next = [(prev[0] - 1 + scriptures.length) % scriptures.length, ...prev.slice(0, 2)]
      return next
    })
  }

  const handleNext = () => {
    setCurrentIndices(prev => {
      const next = [...prev.slice(1), (prev[2] + 1) % scriptures.length]
      return next
    })
  }

  return (
    <div className="h-full flex flex-col justify-between scripture-scroll">
      <button 
        onClick={handlePrev} 
        className="text-gray-800 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 self-center"
        aria-label="Previous verse"
      >
        <ChevronUp size={24} />
      </button>
      <div ref={containerRef} className="flex-grow overflow-hidden flex flex-col justify-center">
        {currentIndices.map((index, i) => (
          <div key={i} className="bg-lavender-50 dark:bg-gray-700 p-4 rounded-lg mb-4 transition-all duration-500" style={{ fontSize: `${fontSize}px` }}>
            <h3 className="font-semibold mb-2 text-center text-gray-900 dark:text-gray-100">{scriptures[index].reference}</h3>
            <p className="font-serif text-gray-700 dark:text-gray-300">{scriptures[index].verse}</p>
          </div>
        ))}
      </div>
      <button 
        onClick={handleNext} 
        className="text-gray-800 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 self-center"
        aria-label="Next verse"
      >
        <ChevronDown size={24} />
      </button>
    </div>
  )
}