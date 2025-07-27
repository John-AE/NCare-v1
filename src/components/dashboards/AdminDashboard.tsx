import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Users, Building, BarChart3, Settings } from 'lucide-react';
import { HospitalSwitcher } from "../HospitalSwitcher";

interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

interface User {
  id: string;
  user_id: string;
  username: string;
  role: string;
  hospital_id: string;
  hospital?: { name: string };
  created_at: string;
  is_active: boolean;
}

interface AdminStats {
  totalHospitals: number;
  totalUsers: number;
  activeHospitals: number;
}

export const AdminDashboard = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats>({ totalHospitals: 0, totalUsers: 0, activeHospitals: 0 });
  const [selectedHospital, setSelectedHospital] = useState<string>('all');
  const [showCreateHospital, setShowCreateHospital] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [newHospital, setNewHospital] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  });

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    username: '',
    role: '',
    hospital_id: ''
  });

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch hospitals
      const { data: hospitalsData, error: hospitalsError } = await supabase
        .from('hospitals')
        .select('*')
        .order('created_at', { ascending: false });

      if (hospitalsError) throw hospitalsError;
      setHospitals(hospitalsData || []);

      // Fetch users with hospital names
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          *,
          hospital:hospitals(name)
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Calculate stats
      const activeHospitals = hospitalsData?.filter(h => h.is_active).length || 0;
      setStats({
        totalHospitals: hospitalsData?.length || 0,
        totalUsers: usersData?.length || 0,
        activeHospitals
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admin data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createHospital = async () => {
    try {
      const { error } = await supabase
        .from('hospitals')
        .insert([newHospital]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Hospital created successfully"
      });
      
      setShowCreateHospital(false);
      setNewHospital({ name: '', address: '', phone: '', email: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating hospital:', error);
      toast({
        title: "Error",
        description: "Failed to create hospital",
        variant: "destructive"
      });
    }
  };

  const createUser = async () => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username: newUser.username,
            role: newUser.role,
            hospital_id: newUser.hospital_id
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update profile with hospital_id
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            hospital_id: newUser.hospital_id,
            role: newUser.role 
          })
          .eq('user_id', authData.user.id);

        if (profileError) throw profileError;
      }

      toast({
        title: "Success",
        description: "User created successfully"
      });
      
      setShowCreateUser(false);
      setNewUser({ email: '', password: '', username: '', role: '', hospital_id: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive"
      });
    }
  };

  const toggleHospitalStatus = async (hospitalId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('hospitals')
        .update({ is_active: !currentStatus })
        .eq('id', hospitalId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Hospital status updated"
      });
      
      fetchData();
    } catch (error) {
      console.error('Error updating hospital:', error);
      toast({
        title: "Error",
        description: "Failed to update hospital status",
        variant: "destructive"
      });
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User status updated successfully"
      });
      
      fetchData();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
  };

  const changeUserPassword = async () => {
    if (!selectedUser || !newPassword.trim()) {
      toast({
        title: "Error",
        description: "Please provide a valid password",
        variant: "destructive"
      });
      return;
    }

    try {
      // Use the edge function to change password with user_id from profiles
      const { error } = await supabase.functions.invoke('admin-change-password', {
        body: { 
          userId: selectedUser.user_id, // Use user_id from profiles table
          newPassword: newPassword.trim()
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password changed successfully"
      });
      
      setShowChangePassword(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error", 
        description: "Failed to change password. This feature requires admin privileges.",
        variant: "destructive"
      });
    }
  };

  const getHospitalStats = (hospitalId: string) => {
    const hospitalUsers = users.filter(user => user.hospital_id === hospitalId);
    const roleCounts = {
      doctor: hospitalUsers.filter(u => u.role === 'doctor').length,
      nurse: hospitalUsers.filter(u => u.role === 'nurse').length,
      finance: hospitalUsers.filter(u => u.role === 'finance').length,
      pharmacy: hospitalUsers.filter(u => u.role === 'pharmacy').length,
    };
    return { total: hospitalUsers.length, ...roleCounts };
  };

  const filteredUsers = selectedHospital === 'all'
    ? users 
    : users.filter(user => user.hospital_id === selectedHospital);

  if (loading) {
    return <div className="p-6">Loading admin dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <HospitalSwitcher />
      </div>
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">Manage hospitals, users, and system settings</p>
        <div className="flex gap-2">
          <Dialog open={showCreateHospital} onOpenChange={setShowCreateHospital}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Hospital
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Hospital</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Hospital Name</Label>
                  <Input
                    id="name"
                    value={newHospital.name}
                    onChange={(e) => setNewHospital({...newHospital, name: e.target.value})}
                    placeholder="Enter hospital name"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={newHospital.address}
                    onChange={(e) => setNewHospital({...newHospital, address: e.target.value})}
                    placeholder="Enter hospital address"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newHospital.phone}
                    onChange={(e) => setNewHospital({...newHospital, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newHospital.email}
                    onChange={(e) => setNewHospital({...newHospital, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
                <Button onClick={createHospital} className="w-full">
                  Create Hospital
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user-email">Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="user-password">Password</Label>
                  <Input
                    id="user-password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="Enter password"
                  />
                </div>
                <div>
                  <Label htmlFor="user-username">Username</Label>
                  <Input
                    id="user-username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <Label htmlFor="user-role">Role</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nurse">Nurse</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="pharmacy">Pharmacy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="user-hospital">Hospital</Label>
                  <Select value={newUser.hospital_id} onValueChange={(value) => setNewUser({...newUser, hospital_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hospital" />
                    </SelectTrigger>
                    <SelectContent>
                      {hospitals.filter(h => h.is_active).map((hospital) => (
                        <SelectItem key={hospital.id} value={hospital.id}>
                          {hospital.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createUser} className="w-full">
                  Create User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>User</Label>
              <Input
                value={selectedUser?.username || ''}
                disabled
              />
            </div>
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <Button onClick={changeUserPassword} className="w-full">
              Change Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hospitals</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHospitals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeHospitals} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Across all hospitals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hospitals Management with Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Hospitals & User Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {hospitals.map((hospital) => {
              const stats = getHospitalStats(hospital.id);
              return (
                <div key={hospital.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold">{hospital.name}</h3>
                      <p className="text-sm text-muted-foreground">{hospital.address}</p>
                      <p className="text-sm text-muted-foreground">{hospital.phone} • {hospital.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={hospital.is_active ? "default" : "secondary"}>
                        {hospital.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleHospitalStatus(hospital.id, hospital.is_active)}
                      >
                        {hospital.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>
                  
                  {/* User Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 p-3 bg-muted/30 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary">{stats.total}</div>
                      <div className="text-xs text-muted-foreground">Total Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{stats.doctor}</div>
                      <div className="text-xs text-muted-foreground">Doctors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{stats.nurse}</div>
                      <div className="text-xs text-muted-foreground">Nurses</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">{stats.finance}</div>
                      <div className="text-xs text-muted-foreground">Finance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{stats.pharmacy}</div>
                      <div className="text-xs text-muted-foreground">Pharmacy</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Users Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Users Management
            <Select value={selectedHospital} onValueChange={setSelectedHospital}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by hospital" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hospitals</SelectItem>
                {hospitals.map((hospital) => (
                  <SelectItem key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-400'}`} 
                         title={user.is_active ? 'Online' : 'Offline'} />
                    <h3 className="font-semibold">{user.username}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {user.hospital?.name || 'No hospital assigned'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {user.role}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user);
                      setShowChangePassword(true);
                    }}
                  >
                    Change Password
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleUserStatus(user.id, user.is_active)}
                  >
                    {user.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};