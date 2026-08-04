import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { SceneBackground } from "@/components/ui/SceneBackground";
import { services } from "@/lib/services";
import {
  fadeUp,
  springTransition,
  staggerContainer,
  staggerItem,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

export function ServicesSection() {
  return (
    <section
      id="services"
      className="relative overflow-hidden py-16 sm:py-24 lg:py-32"
    >
      <SceneBackground showOrbs={false} gridOpacity="opacity-15" />

      <Container className="relative">
        <motion.div
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          className="max-w-2xl"
        >
          <motion.p
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-xs font-medium uppercase tracking-wider text-primary sm:text-sm"
          >
            What we offer
          </motion.p>
          <h2 className="mt-2 text-2xl font-bold leading-tight tracking-tight sm:mt-3 sm:text-3xl lg:text-4xl">
            Services built for makers, engineers, and creators
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:mt-4 sm:text-lg">
            From single-part prints to multi-color prototypes — every job gets
            the same attention to detail.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={staggerContainer}
          className="mt-10 grid grid-cols-1 gap-4 sm:mt-14 sm:gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <motion.article
                key={service.id}
                variants={staggerItem}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={springTransition}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border border-border bg-card/60 p-5 shadow-elevated backdrop-blur-sm transition-[colors,box-shadow,border-color] duration-300 sm:p-6",
                  "hover:border-primary/40 hover:bg-card/80 hover:shadow-elevated",
                  services.length === 3 && "md:last:col-span-2 lg:last:col-span-1",
                )}
              >
                <motion.div
                  aria-hidden
                  className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl"
                  initial={{ opacity: 0.5, scale: 1 }}
                  whileHover={{ opacity: 1, scale: 1.3 }}
                  transition={{ duration: 0.4 }}
                />

                <div className="relative">
                  <motion.span
                    whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary sm:h-11 sm:w-11"
                  >
                    <Icon className="h-5 w-5" />
                  </motion.span>

                  <h3 className="mt-4 text-lg font-semibold sm:mt-5 sm:text-xl">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {service.description}
                  </p>

                  <motion.ul
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                    className="mt-4 space-y-2 sm:mt-5"
                  >
                    {service.features.map((feature) => (
                      <motion.li
                        key={feature}
                        variants={staggerItem}
                        className="flex items-start gap-2 text-sm text-foreground/90"
                      >
                        <motion.span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                          whileHover={{ scale: 1.8 }}
                        />
                        <span>{feature}</span>
                      </motion.li>
                    ))}
                  </motion.ul>

                  <motion.a
                    href={`?material=${service.defaultMaterial}#calculator`}
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="mt-5 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary sm:mt-6"
                  >
                    Estimate with this service
                    <motion.span
                      whileHover={{ x: 2, y: -2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </motion.span>
                  </motion.a>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}
