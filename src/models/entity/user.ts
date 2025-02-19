import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"
@Entity()
export default class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    email: string

    @Column()
    password: string

    @Column()
    userName: string

    constructor(email: string, password: string, userName: string) {
        this.email = email;
        this.password = password;
        this.userName = userName;
      }
}