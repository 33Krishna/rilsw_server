import { Request, Response } from 'express';
import { Student } from '../models/Student';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { ILoginFormData } from '../types';
import { generateCertificateNumber, capitalizeEachWord } from '../utils/certificateUtils';
import { generateToken, verifyToken } from '../utils/jwtUtils';

// Hard-coded master credentials
const MASTER_USERNAME = config.MASTER_USERNAME
const MASTER_PASSWORD = config.MASTER_PASSWORD

// Type augmentation for req.user
declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

export const masterLogin = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (username !== MASTER_USERNAME || password !== MASTER_PASSWORD) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    const token = generateToken(MASTER_USERNAME as string);

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    return res.json({ success: true, message: 'Master login successful', data: { token } });
  } catch (error) {
    console.error('Master login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie('token');
    return res.json({ success: true, message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { collegeRegdNo } = req.body;
    if (!collegeRegdNo) {
      return res.status(400).json({ success: false, message: 'College registration number is required' });
    }

    // Try to find student by collegeRegdNo
    const student = await Student.findOne({ collegeRegdNo });

    // If not found, return STUDENT_NOT_FOUND
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        code: 'STUDENT_NOT_FOUND', 
        message: 'Student not found' 
      });
    }

    // Create JWT token for existing student
    const token = jwt.sign({ studentId: student._id }, config.JWT_SECRET as string, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return student details
    return res.json({
      success: true,
      message: 'Student details fetched successfully',
      data: {
        student
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createStudent = async (req: Request, res: Response) => {
  try {
    const data: ILoginFormData = req.body;
    
    // Validate required fields
    if (!data.name || !data.collegeRegdNo || !data.courseName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, college registration number, and course name are required' 
      });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ collegeRegdNo: data.collegeRegdNo });
    if (existingStudent) {
      return res.status(409).json({ 
        success: false, 
        message: 'Student with this college registration number already exists' 
      });
    }

    // Create new student with auto-generated certificate number
    const certificateNo = data.certificateNo || generateCertificateNumber();
    
    const parseDate = (dateString: string) => {
      if (!dateString) return new Date();
      const [day, month, year] = dateString.split('/');
      if (day && month && year && day.length === 2 && month.length === 2) {
        return new Date(+year, +month - 1, +day); // DD/MM/YYYY
      }
      return new Date(dateString); // Fallback for ISO or MM/DD/YYYY
    };
    
    const studentData = {
      ...data,
      courseName: capitalizeEachWord(data.courseName),
      stream: data.stream ? capitalizeEachWord(data.stream) : '',
      certificateNo,
      fromDate: parseDate(data.fromDate),
      toDate: parseDate(data.toDate),
      dateOfCompletion: parseDate(data.dateOfCompletion)
    };
    
    const student = await Student.create(studentData);

    // Create JWT token
    const token = jwt.sign({ studentId: student._id }, config.JWT_SECRET as string, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return student details
    return res.json({
      success: true,
      message: 'Student created and logged in successfully',
      data: {
        student
      }
    });
  } catch (error) {
    console.error('Create student error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const editStudent = async (req: Request, res: Response) => {
  try {
    // Get studentId from the validated user (set by middleware)
    const studentId = req.user?.studentId;
    
    if (!studentId) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Find the student to ensure they exist and user has permission
    const existingStudent = await Student.findById(studentId);
    if (!existingStudent) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const updateData: Partial<ILoginFormData> = req.body;

    // Check if certificateNo is being changed and if it conflicts with another student
    if (updateData.certificateNo && updateData.certificateNo !== existingStudent.certificateNo) {
      const conflictingCertificate = await Student.findOne({ 
        certificateNo: updateData.certificateNo,
        _id: { $ne: studentId } // Exclude current student
      });
      if (conflictingCertificate) {
        return res.status(409).json({ 
          success: false, 
          message: 'Student with this certificate number already exists' 
        });
      }
    }

    // Check if collegeRegdNo is being changed and if it conflicts with another student
    if (updateData.collegeRegdNo && updateData.collegeRegdNo !== existingStudent.collegeRegdNo) {
      const conflictingStudent = await Student.findOne({ 
        collegeRegdNo: updateData.collegeRegdNo,
        _id: { $ne: studentId } // Exclude current student
      });
      if (conflictingStudent) {
        return res.status(409).json({ 
          success: false, 
          message: 'Student with this college registration number already exists' 
        });
      }
    }

    // Parse dates if provided
    const parseDate = (dateString: string) => {
      if (!dateString) return new Date();
      const [day, month, year] = dateString.split('/');
      if (day && month && year && day.length === 2 && month.length === 2) {
        return new Date(+year, +month - 1, +day); // DD/MM/YYYY
      }
      return new Date(dateString); // Fallback for ISO or MM/DD/YYYY
    };

    // Prepare update data
    const studentUpdateData = {
      ...updateData,
      courseName: updateData.courseName ? capitalizeEachWord(updateData.courseName) : undefined,
      stream: updateData.stream ? capitalizeEachWord(updateData.stream) : undefined,
      fromDate: updateData.fromDate ? parseDate(updateData.fromDate) : existingStudent.fromDate,
      toDate: updateData.toDate ? parseDate(updateData.toDate) : existingStudent.toDate,
      dateOfCompletion: updateData.dateOfCompletion ? parseDate(updateData.dateOfCompletion) : existingStudent.dateOfCompletion
    };

    // Remove undefined fields
    Object.keys(studentUpdateData).forEach(key => {
      if (studentUpdateData[key as keyof typeof studentUpdateData] === undefined) {
        delete studentUpdateData[key as keyof typeof studentUpdateData];
      }
    });

    // Update the student
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      studentUpdateData,
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ success: false, message: 'Failed to update student' });
    }

    return res.json({
      success: true,
      message: 'Student updated successfully',
      data: {
        student: updatedStudent
      }
    });
  } catch (error: any) {
    console.error('Edit student error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors: validationErrors 
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ 
        success: false, 
        message: `${field} already exists` 
      });
    }
    
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = verifyToken(token);
    const student = await Student.findById(decoded.studentId);
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    return res.json({
      success: true,
      data: {
        student
      }
    });
  } catch (error) {
    console.error('Me error:', error);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}; 