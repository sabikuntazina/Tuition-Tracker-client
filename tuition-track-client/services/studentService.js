import api from './api';

export const studentService = {
  async getStudents(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    const queryString = query.toString();
    return api.get(`/students${queryString ? `?${queryString}` : ''}`);
  },

  async getStudentById(id) {
    return api.get(`/students/${id}`);
  },

  async createStudent(studentData) {
    return api.post('/students', studentData);
  },

  async updateStudent(id, studentData) {
    return api.put(`/students/${id}`, studentData);
  },

  async deleteStudent(id) {
    return api.delete(`/students/${id}`);
  },
};
