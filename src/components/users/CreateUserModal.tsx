import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useRef, useState } from "react";

const createUserSchema = z.object({
  firstName: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(50),
  lastName: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50),
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  role: z.enum(["admin", "technician", "administration"]),
  phone: z.string().optional(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onUserCreated,
}) => {
  const { toast } = useToast();

  // Typage correct de la mutation : data et error
  const mutation = useMutation<
    unknown, // Return type from api.post
    ApiError, // Error type
    CreateUserForm // Variables type
  >({
    mutationFn: (newUser: CreateUserForm) => api.post("users", newUser),
    onSuccess: () => {
      toast({
        title: "Utilisateur créé",
        description: "Le nouvel utilisateur a été créé avec succès.",
      });
      onUserCreated();
      onClose();
    },
    onError: (error: ApiError | unknown) => {
      let errorMessage = "Erreur lors de la création";
      if (typeof error === "object" && error !== null && "details" in error) {
        const details = (error as ApiError).details;
        if (details && typeof details === "object" && "error" in details && typeof details.error === 'string') {
          errorMessage = details.error || errorMessage;
        }
      }
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "technician",
      phone: "",
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const onSubmit = (data: CreateUserForm) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value) formData.append(key, value as string);
    });
    if (avatarFile) formData.append("avatar", avatarFile);
    mutation.mutate(formData as any);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validation du fichier
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Type de fichier non autorisé",
          description: "Veuillez sélectionner une image (JPEG, PNG, WebP)",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > maxSize) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille maximale est de 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setAvatarFile(file);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrateur";
      case "technician":
        return "Technicien";
      case "administration":
        return "Administration";
      default:
        return role;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
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
                      <SelectItem value="admin">
                        {getRoleLabel("admin")}
                      </SelectItem>
                      <SelectItem value="technician">
                        {getRoleLabel("technician")}
                      </SelectItem>
                      <SelectItem value="administration">
                        {getRoleLabel("administration")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone (optionnel)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <FormLabel>Photo de profil (optionnel)</FormLabel>
              <div className="flex items-center space-x-4">
                <Input
                  ref={fileInputRef}
                  type="file"
                  name="avatar"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="flex-1"
                />
                {avatarFile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAvatarFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    Supprimer
                  </Button>
                )}
              </div>
              {avatarFile && (
                <div className="text-sm text-gray-500">
                  Fichier sélectionné: {avatarFile.name} ({(avatarFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={mutation.status === "pending"}>
                {mutation.status === "pending" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Créer
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserModal;
