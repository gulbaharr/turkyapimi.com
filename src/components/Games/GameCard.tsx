import { Calendar, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Game, getImageUrl } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface GameCardProps {
  game: Game;
  index?: number;
}

export function GameCard({ game, index = 0 }: GameCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: "easeOut"
      }}
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link to={`/oyun/${game.slug}`}>
        <Card className="game-card group overflow-hidden border-game-card-border h-full hover:shadow-lg transition-shadow duration-300">
          <motion.div 
            className="aspect-video relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <motion.img
              src={getImageUrl(game.resim)}
              alt={game.isim}
              className="game-card-image w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6 }}
            />
            <motion.div 
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              whileHover={{ opacity: 1 }}
            />
          </motion.div>
          
          <CardContent className="p-4 space-y-3">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }}
            >
              <motion.h3 
                className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                {game.isim}
              </motion.h3>
              <motion.p 
                className="text-muted-foreground text-sm line-clamp-2 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 + 0.3 }}
              >
                {game.aciklama}
              </motion.p>
            </motion.div>
            
            {/* Developer */}
            <motion.div 
              className="flex items-center text-sm text-muted-foreground"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 + 0.4 }}
            >
              <Users className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="line-clamp-1">
                {game.gelistiriciler.map(dev => dev.isim).join(', ')}
              </span>
            </motion.div>
            
            {/* Release Date */}
            <motion.div 
              className="flex items-center text-sm text-muted-foreground"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 + 0.5 }}
            >
              <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
              <span>{game.cikis_tarihi}</span>
            </motion.div>
            
            {/* Tags */}
            <motion.div 
              className="flex flex-wrap gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 + 0.6 }}
            >
              {game.etiketler.slice(0, 3).map((tag, tagIndex) => (
                <motion.div
                  key={tag.slug}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.2, 
                    delay: index * 0.1 + 0.7 + tagIndex * 0.05 
                  }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Badge 
                    variant="secondary" 
                    className="text-xs px-2 py-1 hover:bg-primary/10 transition-colors"
                  >
                    {tag.isim}
                  </Badge>
                </motion.div>
              ))}
              {game.etiketler.length > 3 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.2, 
                    delay: index * 0.1 + 1 
                  }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Badge variant="secondary" className="text-xs px-2 py-1">
                    +{game.etiketler.length - 3}
                  </Badge>
                </motion.div>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}