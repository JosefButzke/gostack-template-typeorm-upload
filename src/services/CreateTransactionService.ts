import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepositoryCustom from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(
      TransactionsRepositoryCustom,
    );
    const categoryRepository = getRepository(Category);

    const balance = await transactionsRepository.getBalance();

    if (type === 'outcome' && balance.total < value) {
      throw new AppError('Saldo insuficiente.');
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      category_id: '',
      type,
    });

    const categoryExists = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!categoryExists) {
      const newCategory = categoryRepository.create({ title: category });
      await categoryRepository.save(newCategory);
      transaction.category_id = newCategory.id;
    } else {
      transaction.category_id = categoryExists.id;
    }

    await transactionsRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
