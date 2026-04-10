import React from 'react'
import { useStandings } from '../hooks/useStandings'

const TablaPosiciones = () => {
  
    const table = useStandings();
  
    return (
     <div>
    {table.map((u, i) => (
      <div key={u.uid}>
        #{i + 1} - {u.displayName} - {u.points} pts
      </div>
    ))}
  </div>
  )
}

export default TablaPosiciones