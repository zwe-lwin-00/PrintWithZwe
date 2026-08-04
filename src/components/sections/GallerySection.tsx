import { motion } from "framer-motion";
import { ImageIcon } from "lucide-react";
import { Container } from "@/components/layout/Container";
import {
  fadeUp,
  scaleIn,
  staggerContainer,
  staggerItem,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

const placeholderCategories = ["Functional", "Desk Setup", "Art & Figures"];

export function GallerySection() {
  return (
    <section
      id="gallery"
      className="relative overflow-hidden border-y border-border/60 py-16 sm:py-24 lg:py-32"
    >
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          className="mx-auto max-w-xl px-2 text-center sm:px-0"
        >
          <motion.span
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
            custom={0.1}
            whileHover={{ rotate: 5, scale: 1.05 }}
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground sm:h-14 sm:w-14"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </motion.div>
          </motion.span>
          <h2 className="mt-5 text-2xl font-bold tracking-tight sm:mt-6 sm:text-3xl lg:text-4xl">
            Print Gallery
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:mt-4 sm:text-base">
            Past projects and printed models will appear here — functional parts,
            desk setups, art figures, and more.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={staggerContainer}
          className="mt-10 grid grid-cols-1 gap-4 xs:grid-cols-2 sm:mt-14 lg:grid-cols-3"
        >
          {placeholderCategories.map((category, index) => (
            <motion.div
              key={category}
              variants={staggerItem}
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-border bg-card/40 p-4 shadow-elevated transition-[colors,box-shadow] duration-300 sm:p-6",
                index === 2 && "xs:col-span-2 lg:col-span-1",
              )}
            >
              <motion.div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
              />
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{
                  duration: 3 + index * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.3,
                }}
                className="relative aspect-[4/3] rounded-lg bg-muted/60 sm:aspect-video"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="h-10 w-10 rounded-lg border border-dashed border-border/80 sm:h-12 sm:w-12"
                    animate={{ rotate: [0, 90, 180, 270, 360] }}
                    transition={{
                      duration: 12,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </div>
              </motion.div>
              <p className="relative mt-3 text-sm font-medium sm:mt-4">{category}</p>
              <p className="relative mt-1 text-xs text-muted-foreground">
                Coming soon
              </p>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
