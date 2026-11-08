import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  Bus,
  MapPin,
  Users,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Phone,
  Shield,
  X,
  AlertTriangle,
} from 'lucide-react';

export const TransportView: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'routes' | 'vehicles' | 'allocations'>('routes');
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Queries
  const { data: routesData, isLoading: isRoutesLoading } = useQuery({
    queryKey: ['transport-routes'],
    queryFn: () => api.get<any>('/transport/routes'),
  });

  const { data: vehiclesData, isLoading: isVehiclesLoading } = useQuery({
    queryKey: ['transport-vehicles'],
    queryFn: () => api.get<any>('/transport/vehicles'),
  });

  const { data: studentsData } = useQuery({
    queryKey: ['students-brief'],
    queryFn: () => api.get<any>('/students'),
  });

  // Vehicle Form State
  const [vehicleForm, setVehicleForm] = useState({
    vehicleNumber: 'DL 01 AB ' + Math.floor(1000 + Math.random() * 9000),
    driverName: '',
    driverPhone: '',
    capacity: 40,
  });

  // Route Form State
  const [routeForm, setRouteForm] = useState({
    name: '',
    vehicleId: '',
    stops: [
      { stopName: 'Central Metro Station', pickupTime: '07:30', dropTime: '15:30', fare: 1500, order: 1 },
      { stopName: 'Sector 62 Crossroad', pickupTime: '07:45', dropTime: '15:15', fare: 1200, order: 2 },
    ],
  });

  // Student Assignment Form
  const [assignForm, setAssignForm] = useState({
    studentId: '',
    routeId: '',
    stopName: '',
  });

  // Mutations
  const createVehicleMutation = useMutation({
    mutationFn: (data: any) => api.post('/transport/vehicles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-vehicles'] });
      setIsVehicleModalOpen(false);
      setVehicleForm({
        vehicleNumber: 'DL 01 AB ' + Math.floor(1000 + Math.random() * 9000),
        driverName: '',
        driverPhone: '',
        capacity: 40,
      });
    },
  });

  const createRouteMutation = useMutation({
    mutationFn: (data: any) => api.post('/transport/routes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-routes'] });
      setIsRouteModalOpen(false);
    },
  });

  const assignStudentMutation = useMutation({
    mutationFn: (data: any) => api.post('/transport/assignments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-routes'] });
      setIsAssignModalOpen(false);
    },
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: (studentId: string) => api.delete(`/transport/assignments/${studentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-routes'] });
    },
  });

  const selectedRouteForAssign = routesData?.data?.find((r: any) => r.id === assignForm.routeId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Transport & Bus Fleet</h1>
          <p className="text-sm text-slate-500 mt-1">
            Bus route planning, vehicle fleet management, stop schedules & seat allocations
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'vehicles' && (
            <button
              onClick={() => setIsVehicleModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Vehicle</span>
            </button>
          )}

          {activeTab === 'routes' && (
            <button
              onClick={() => setIsRouteModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Route</span>
            </button>
          )}

          {activeTab === 'allocations' && (
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Allocate Student</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('routes')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'routes'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Bus Routes & Stops</span>
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'vehicles'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Bus className="w-4 h-4" />
          <span>Fleet Vehicles</span>
        </button>
        <button
          onClick={() => setActiveTab('allocations')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'allocations'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Allocations</span>
        </button>
      </div>

      {/* TAB 1: ROUTES */}
      {activeTab === 'routes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {isRoutesLoading ? (
            <div className="col-span-full py-12 text-center text-sm text-slate-400">Loading routes...</div>
          ) : routesData?.data?.length === 0 ? (
            <div className="col-span-full py-12 text-center text-sm text-slate-400 italic">No routes created yet.</div>
          ) : (
            routesData?.data?.map((route: any) => {
              const capacity = route.vehicle?.capacity || 40;
              const percent = Math.min(100, Math.round((route.studentCount / capacity) * 100));

              return (
                <div key={route.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{route.name}</h3>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Vehicle: {route.vehicle ? `${route.vehicle.vehicleNumber} (${route.vehicle.driverName})` : 'Unassigned'}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900">{route.studentCount} / {capacity} Seats</span>
                      <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${percent > 90 ? 'bg-rose-500' : 'bg-brand-600'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stops Timeline */}
                  <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 space-y-2.5">
                    <div className="text-xs font-bold text-slate-700">Scheduled Stops:</div>
                    <div className="space-y-2">
                      {route.stops.map((stop: any, idx: number) => (
                        <div key={stop.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-slate-800">{stop.stopName}</span>
                          </div>
                          <div className="text-slate-500 flex items-center gap-3 text-[11px]">
                            <span>Pickup: {stop.pickupTime}</span>
                            <span>Drop: {stop.dropTime}</span>
                            <span className="font-semibold text-slate-900">₹{Number(stop.fare)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: FLEET VEHICLES */}
      {activeTab === 'vehicles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isVehiclesLoading ? (
            <div className="col-span-full py-12 text-center text-sm text-slate-400">Loading vehicles...</div>
          ) : vehiclesData?.data?.length === 0 ? (
            <div className="col-span-full py-12 text-center text-sm text-slate-400 italic">No vehicles in fleet.</div>
          ) : (
            vehiclesData?.data?.map((v: any) => (
              <div key={v.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-slate-900 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                    {v.vehicleNumber}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {v.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Seating Capacity: <strong className="text-slate-900">{v.capacity} Passengers</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <span>Driver: <strong className="text-slate-900">{v.driverName}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>Contact: {v.driverPhone}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: STUDENT ALLOCATIONS */}
      {activeTab === 'allocations' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/80 border-b border-slate-100 font-bold text-sm text-slate-900">
            Current Bus Transport Allocations
          </div>

          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Admission No</th>
                <th className="px-4 py-3">Assigned Route</th>
                <th className="px-4 py-3">Boarding Stop</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(() => {
                const allAssignments = routesData?.data?.flatMap((r: any) =>
                  (r.assignments || []).map((a: any) => ({ ...a, routeName: r.name }))
                ) || [];
                if (isRoutesLoading) {
                  return (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">Loading allocations...</td>
                    </tr>
                  );
                }
                if (allAssignments.length === 0) {
                  return (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic">No student transport allocations found.</td>
                    </tr>
                  );
                }
                return allAssignments.map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {a.student.firstName} {a.student.lastName}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {a.student.admissionNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{a.routeName}</td>
                    <td className="px-4 py-3 text-slate-600">{a.stopName}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeAssignmentMutation.mutate(a.studentId)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                      >
                        Deallocate
                      </button>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Register Transport Vehicle</h2>
              <button onClick={() => setIsVehicleModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createVehicleMutation.mutate(vehicleForm);
              }}
              className="space-y-4 mt-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Registration No</label>
                <input
                  type="text"
                  required
                  value={vehicleForm.vehicleNumber}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Driver Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={vehicleForm.driverName}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Driver Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="+91-9876543210"
                    value={vehicleForm.driverPhone}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, driverPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Seat Capacity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={vehicleForm.capacity}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createVehicleMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"
                >
                  Register Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocate Student Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Allocate Student Bus Seat</h2>
              <button onClick={() => setIsAssignModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                assignStudentMutation.mutate(assignForm);
              }}
              className="space-y-4 mt-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student</label>
                <select
                  required
                  value={assignForm.studentId}
                  onChange={(e) => setAssignForm({ ...assignForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="">Choose student...</option>
                  {studentsData?.data?.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.admissionNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transport Route</label>
                <select
                  required
                  value={assignForm.routeId}
                  onChange={(e) => setAssignForm({ ...assignForm, routeId: e.target.value, stopName: '' })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="">Select bus route...</option>
                  {routesData?.data?.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.studentCount}/{r.vehicle?.capacity || 40} seats used)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Boarding Stop</label>
                <select
                  required
                  value={assignForm.stopName}
                  onChange={(e) => setAssignForm({ ...assignForm, stopName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="">Select stop...</option>
                  {selectedRouteForAssign?.stops?.map((stop: any) => (
                    <option key={stop.id} value={stop.stopName}>
                      {stop.stopName} (Pickup: {stop.pickupTime}, Fare: ₹{Number(stop.fare)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignStudentMutation.isPending || !assignForm.stopName}
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
