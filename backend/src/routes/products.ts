import express, { Request, Response } from 'express';
import productService from '../services/productService';
import { ApiResponse } from '../types';

const router = express.Router();

// Get all products
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;

    let products;
    if (search && typeof search === 'string') {
      products = await productService.search(search);
    } else if (category && typeof category === 'string') {
      products = await productService.findByCategory(category);
    } else {
      products = await productService.findAll();
    }

    const response: ApiResponse = {
      success: true,
      data: products
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch products'
    };
    res.status(500).json(response);
  }
});

// Get product by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await productService.findById(req.params.id);

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: 'Product not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: product
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch product'
    };
    res.status(500).json(response);
  }
});

// Create product (admin only - simplified for demo)
router.post('/', async (req: Request, res: Response) => {
  try {
    const product = await productService.create(req.body);

    const response: ApiResponse = {
      success: true,
      data: product,
      message: 'Product created successfully'
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create product'
    };
    res.status(500).json(response);
  }
});

// Update product (admin only - simplified for demo)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const product = await productService.update(req.params.id, req.body);

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: 'Product not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: product,
      message: 'Product updated successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update product'
    };
    res.status(500).json(response);
  }
});

// Delete product (admin only - simplified for demo)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await productService.delete(req.params.id);

    if (!deleted) {
      const response: ApiResponse = {
        success: false,
        error: 'Product not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Product deleted successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete product'
    };
    res.status(500).json(response);
  }
});

export default router;
