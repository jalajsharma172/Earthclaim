import { useState ,useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin } from "lucide-react"; 
import { BrowserStorageService, SuprabaseStorageService, type UserData } from "@shared/login";
import { useNavigate } from "react-router-dom";

 

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  username: z.string().min(1, "Username is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

 

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
 const navigate = useNavigate(); 

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      username: "",
    },
  });

 
  

//  Check for existing user in local storage on component mount
  useState(() => {
    const checkStoredUser = async () => {
      const storedUser = await  BrowserStorageService.getUserFromStorage();
      if (storedUser) {
        console.log( 'Check for existing user '+ storedUser);
      } 
    };
    checkStoredUser();
  });


  const handleFormLogin = async () => {
    setIsLoading(true);
    try {
       const formData = form.getValues();
      const username = formData.username;
      const email: string = formData.email ?? "";

      console.log(formData,'formdata');


      
      await SuprabaseStorageService(username,email);
      await BrowserStorageService.saveUserToStorage({username:username,useremail:email});
      console.log("handleFormLogin done");
      
    // window.location.reload();
      
    } catch (error) {
      console.log('Login Superbase is not working.');
      
      // console.error("Login failed:", error);
      // You can add user-friendly error messages here
      // For example: setErrorState(error.message);
    } finally {
      setIsLoading(false);
    }
  };

 

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Territory Walker</CardTitle>
          <p className="text-gray-600 mt-2">Claim the world, one step at a time</p>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormLogin)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Email address (optional)"
                        className="px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem> 
                      <Input
                        {...field}
                        placeholder="Choose your username"
                        className="px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      /> 
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
              >
                {isLoading ? "Starting Adventure..." : "Start Playing"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleFormLogin()}
              disabled={isLoading}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors"
            >
              Play as Guest
            </Button>
            <p className="text-center text-sm text-gray-500 mt-4">
              Join thousands of territory explorers worldwide!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}