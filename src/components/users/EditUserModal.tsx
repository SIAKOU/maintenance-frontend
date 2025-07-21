import React, { useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { User as ApiUser } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRef, useState } from "react";
import { getImageUrl } from '@/lib/api';

// Schéma de validation pour le formulaire de modification
const editUserSchema = z.object({
  firstName: z.string().min(2, "Le prénom est requis."),
  lastName: z.string().min(2, "Le nom est requis."),
  email: z.string().email("L'adresse email est invalide."),
  phone: z.string().optional(),
  role: z.enum(["admin", "technician", "administration"]),
});

type EditUserFormData = z.infer<typeof editUserSchema>;
export type { EditUserFormData };

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ApiUser | null; // L'utilisateur à modifier
  onUpdate: (data: EditUserFormData) => void;
  isUpdating: boolean;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdate,
  isUpdating,
}) => {
  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    // Les valeurs par défaut seront mises à jour quand l'utilisateur changera
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "technician",
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user?.avatar);

  // Ce `useEffect` est crucial. Il met à jour le formulaire chaque fois
  // que l'utilisateur sélectionné change (quand la modale s'ouvre).
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
      });
    }
  }, [user, form]);

  const onSubmit: SubmitHandler<EditUserFormData> = (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value) formData.append(key, value as string);
    });
    if (avatarFile) formData.append("avatar", avatarFile);
    onUpdate(formData as any);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };
  const handleRemoveAvatar = async () => {
    // Appeler l'API pour supprimer l'avatar (DELETE /api/users/:id/avatar)
    if (!user) return;
    await fetch(`/api/users/${user.id}/avatar`, { method: "DELETE", credentials: "include" });
    setAvatarFile(null);
    setAvatarPreview(undefined);
  };

  // Ne rien rendre si aucun utilisateur n'est sélectionné
  if (!user) return null;

  const BACKEND_URL = 'http://localhost:5000';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier l'utilisateur</DialogTitle>
          <DialogDescription>
            Mettez à jour les informations de {user.firstName} {user.lastName}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <div className="flex flex-col items-center gap-2 pb-2">
              <Avatar className="h-20 w-20">
                <AvatarImage src={getImageUrl(avatarPreview)} />
                <AvatarFallback>{user.firstName?.[0] || "?"}{user.lastName?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Changer la photo
                </Button>
                <Button type="button" variant="outline" onClick={handleRemoveAvatar}>
                  Supprimer
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  name="avatar"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone (Optionnel)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rôle</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Administrateur</SelectItem>
                      <SelectItem value="technician">Technicien</SelectItem>
                      <SelectItem value="administration">
                        Administration
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Sauvegarde..." : "Sauvegarder les modifications"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserModal;
